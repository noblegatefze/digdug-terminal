import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Topic routing (Vercel env)
const TG_GROUP_CHAT_ID = Number(process.env.TG_GROUP_CHAT_ID || "0");
const TG_THREAD_GOLDEN = Number(process.env.TG_THREAD_GOLDEN || "0");

// shared secret
const INTERNAL_SECRET = process.env.TG_INTERNAL_SECRET || "";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Service-role Supabase client (server-only)
const supabaseAdmin = createClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

type InlineKeyboard = { inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> };

async function tgCall(method: string, payload: any) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json?.ok === false) {
    const err: any = new Error(`tg_${method}_failed`);
    err.status = res.status;
    err.tg = json;
    err.payload = payload;
    throw err;
  }
  return json;
}

async function sendMessage(chatId: number, text: string, opts?: { replyMarkup?: InlineKeyboard }) {
  await tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
  });
}

async function sendMessageThread(chatId: number, threadId: number, text: string, opts?: { replyMarkup?: InlineKeyboard }) {
  await tgCall("sendMessage", {
    chat_id: chatId,
    message_thread_id: threadId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
  });
}

async function sendGolden(text: string, fallbackChatId: number, opts?: { replyMarkup?: InlineKeyboard }) {
  // route to golden topic if configured
  if (TG_GROUP_CHAT_ID && TG_THREAD_GOLDEN) {
    await sendMessageThread(TG_GROUP_CHAT_ID, TG_THREAD_GOLDEN, text, opts);
    return;
  }
  await sendMessage(fallbackChatId, text, opts);
}

function looksLikeTxHash(h: string) {
  const s = h.trim();
  if (/^0x[a-fA-F0-9]{16,}$/.test(s)) return true;
  if (s.includes("bscscan.com/tx/")) return true;
  return false;
}

function extractTxHashOrLink(input: string): { txHash: string | null; txUrl: string | null } {
  const s = input.trim();
  const m = s.match(/bscscan\.com\/tx\/(0x[a-fA-F0-9]{16,})/);
  if (m?.[1]) {
    const tx = m[1];
    return { txHash: tx, txUrl: `https://bscscan.com/tx/${tx}` };
  }
  if (/^0x[a-fA-F0-9]{16,}$/.test(s)) return { txHash: s, txUrl: `https://bscscan.com/tx/${s}` };
  return { txHash: null, txUrl: null };
}

function maskEvmAddress(addr: string) {
  const a = addr.trim();
  if (!a.startsWith("0x") || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

async function lookupTgUserLabel(tgUserId: number): Promise<string> {
  const { data } = await supabaseAdmin
    .from("dd_tg_chats")
    .select("title, username")
    .eq("chat_id", String(tgUserId))
    .limit(1);

  const row = (data?.[0] as any) ?? null;
  if (!row) return `TG:${tgUserId}`;
  if (row.username) return `@${row.username}`;
  if (row.title) return String(row.title);
  return `TG:${tgUserId}`;
}

type Body = {
  secret?: string;
  claim_code?: string; // GF-XXXX
  tx?: string;         // 0xHASH or bscscan link
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!INTERNAL_SECRET) {
      return NextResponse.json({ ok: false, error: "missing TG_INTERNAL_SECRET on terminal" }, { status: 500 });
    }

    if (String(body.secret ?? "") !== INTERNAL_SECRET) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const claimCode = String(body.claim_code ?? "").trim().toUpperCase();
    const txIn = String(body.tx ?? "").trim();

    if (!claimCode.startsWith("GF-")) {
      return NextResponse.json({ ok: false, error: "bad claim_code" }, { status: 400 });
    }
    if (!txIn || !looksLikeTxHash(txIn)) {
      return NextResponse.json({ ok: false, error: "bad tx" }, { status: 400 });
    }

    const { txHash, txUrl } = extractTxHashOrLink(txIn);
    if (!txHash || !txUrl) return NextResponse.json({ ok: false, error: "bad tx hash/link" }, { status: 400 });

    // lookup event
    const { data: evRows, error: evErr } = await supabaseAdmin
      .from("dd_tg_golden_events")
      .select("id, token, chain, usd_value")
      .eq("claim_code", claimCode)
      .limit(1);

    if (evErr) return NextResponse.json({ ok: false, error: evErr.message }, { status: 500 });

    const ev = (evRows?.[0] as any) ?? null;
    if (!ev?.id) return NextResponse.json({ ok: false, error: "claim code not found" }, { status: 404 });

    // lookup claim (latest)
    const { data: claimRows, error: cErr } = await supabaseAdmin
      .from("dd_tg_golden_claims")
      .select("id, tg_user_id, payout_usdt_bep20")
      .eq("golden_event_id", ev.id)
      .order("claimed_at", { ascending: false })
      .limit(1);

    if (cErr) return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });

    const claim = (claimRows?.[0] as any) ?? null;
    if (!claim?.id) return NextResponse.json({ ok: false, error: "no claim row found" }, { status: 404 });

    const winnerLabel = await lookupTgUserLabel(Number(claim.tg_user_id));
    const maskedAddr = claim.payout_usdt_bep20 ? maskEvmAddress(String(claim.payout_usdt_bep20)) : "N/A";

    const paidMsg =
      `✅ <b>PAID</b>\n` +
      `Claim: <b>${claimCode}</b>\n` +
      `Winner: <b>${winnerLabel}</b>\n` +
      `Payout: <code>${maskedAddr}</code>\n` +
      `Token: ${ev.token} (${ev.chain})\n` +
      `Value: $${Number(ev.usd_value).toFixed(2)}\n` +
      `TX: ${txUrl}`;

    // ✅ Direct broadcast to Golden topic
    await sendGolden(paidMsg, TG_GROUP_CHAT_ID || 0);

    return NextResponse.json({ ok: true, claim_code: claimCode, tx_hash: txHash });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "internal broadcast failed" }, { status: 500 });
  }
}
