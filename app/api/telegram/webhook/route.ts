import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

type InlineKeyboard = { inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> };

async function sendMessage(chatId: number, text: string, opts?: { replyMarkup?: InlineKeyboard }) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    }),
  });
}

// Used when we need to know if DM fails (user never started bot)
async function sendMessageChecked(chatId: number, text: string, opts?: { replyMarkup?: InlineKeyboard }) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    }),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json?.ok === false) {
    const err: any = new Error("telegram_send_failed");
    err.status = res.status;
    err.tg = json;
    throw err;
  }
  return json;
}

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Service-role Supabase client (server-only)
const supabaseAdmin = createClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

type TgChat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function chatDisplayTitle(chat: TgChat): string | null {
  if (chat.title) return chat.title;
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

async function upsertTgChat(chat: TgChat) {
  const chat_id = String(chat.id);

  const payload = {
    chat_id,
    chat_type: chat.type ?? null,
    title: chatDisplayTitle(chat),
    username: chat.username ?? null,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("dd_tg_chats").upsert(payload, { onConflict: "chat_id" });
  if (error) console.error("[tg] dd_tg_chats upsert error:", error);
}

function getMsg(update: any) {
  return update?.message ?? update?.edited_message ?? null;
}

function getText(update: any): string {
  const msg = getMsg(update);
  return String(msg?.text ?? "").trim();
}

function getChat(update: any) {
  const msg = getMsg(update);
  return msg?.chat ?? null;
}

function getChatId(update: any): number | null {
  const chat = getChat(update);
  return typeof chat?.id === "number" ? chat.id : null;
}

function fromUser(update: any) {
  return update?.message?.from ?? update?.edited_message?.from ?? null;
}

function displayName(update: any): string {
  const u = fromUser(update);
  if (!u) return "user";
  if (u.username) return `@${u.username}`;
  const first = u.first_name ? String(u.first_name) : "";
  const last = u.last_name ? ` ${u.last_name}` : "";
  const full = `${first}${last}`.trim();
  return full || "user";
}

function generateVerifyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "DG-";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function looksLikeEvmAddress(a: string) {
  return /^0x[a-fA-F0-9]{8,}$/.test(a.trim());
}

function maskEvmAddress(addr: string) {
  const a = addr.trim();
  if (!a.startsWith("0x") || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function tgDeepLinkVerify() {
  return "https://t.me/DigsterBot?start=verify";
}

function verifyButton(): InlineKeyboard {
  return { inline_keyboard: [[{ text: "✅ Verify now", url: tgDeepLinkVerify() }]] };
}

function welcomeText(firstName?: string, graceMinutes = 10) {
  const first = firstName ? ` ${firstName}` : "";
  return `Welcome${first}.

<b>Verification required</b> (Phase Zero testers)

You have <b>${graceMinutes} minutes</b> to verify your Terminal Pass or you will be removed.

<b>Step 1:</b> DM @DigsterBot and type <code>/verify</code>
<b>Step 2:</b> Go to https://digdug.do and in Terminal type:
<code>verify DG-XXXX</code>`;
}

function reminderText(minutesLeft: number) {
  return `⚠️ <b>Verification required</b>

You have <b>${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}</b> left to verify or you will be removed.

DM @DigsterBot and type <code>/verify</code>`;
}

async function maybeSendGraceExpiryReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 60 * 1000);

  const nowIso = now.toISOString();
  const soonIso = soon.toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("group_chat_id,tg_user_id,grace_expires_at,reminded_at,status")
    .eq("status", "PENDING")
    .is("reminded_at", null)
    .gt("grace_expires_at", nowIso)
    .lte("grace_expires_at", soonIso)
    .limit(25);

  if (error) {
    console.error("[tg] reminder query failed:", error);
    return;
  }
  if (!rows || rows.length === 0) return;

  for (const r of rows as any[]) {
    const groupChatId = Number(r.group_chat_id);
    const expiresAt = new Date(r.grace_expires_at);
    const minsLeft = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / (60 * 1000)));

    await sendMessage(groupChatId, reminderText(minsLeft), { replyMarkup: verifyButton() });

    const { error: uErr } = await supabaseAdmin
      .from("dd_tg_pending_joins")
      .update({ reminded_at: new Date().toISOString() })
      .eq("group_chat_id", String(groupChatId))
      .eq("tg_user_id", Number(r.tg_user_id));

    if (uErr) console.error("[tg] reminder update failed:", uErr);
  }
}

export async function GET() {
  return new Response("Telegram webhook OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  const update = await req.json();

  // Persist chat metadata on ANY update
  const chatAny: TgChat | undefined =
    update?.message?.chat ??
    update?.edited_message?.chat ??
    update?.channel_post?.chat ??
    update?.edited_channel_post?.chat ??
    update?.my_chat_member?.chat ??
    update?.chat_member?.chat ??
    update?.callback_query?.message?.chat;

  if (chatAny?.id && chatAny?.type) {
    await upsertTgChat(chatAny);
  }

  // Opportunistic reminder sweep (no cron required)
  await maybeSendGraceExpiryReminders();

  const text = getText(update);
  const chat = getChat(update);
  const chatId = getChatId(update);

  // Join detection via chat_member updates
  const cm = update?.chat_member;
  const cmChat = cm?.chat;
  const cmNew = cm?.new_chat_member;
  const cmStatus = cmNew?.status;
  const cmUser = cmNew?.user;

  if (cmChat?.id && (cmChat?.type === "group" || cmChat?.type === "supergroup") && cmUser?.id && cmStatus === "member") {
    const groupChatId = Number(cmChat.id);
    const tgUserId = Number(cmUser.id);

    const graceMinutes = 10;
    const graceExpiresAt = new Date(Date.now() + graceMinutes * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("dd_tg_pending_joins")
      .upsert(
        {
          group_chat_id: String(groupChatId),
          tg_user_id: tgUserId,
          grace_expires_at: graceExpiresAt,
          warned_at: new Date().toISOString(),
          status: "PENDING",
        },
        { onConflict: "group_chat_id,tg_user_id" }
      );

    if (error) console.error("[tg] pending join upsert error (chat_member):", error);

    await sendMessage(groupChatId, welcomeText(cmUser?.first_name, graceMinutes), { replyMarkup: verifyButton() });
    return NextResponse.json({ ok: true });
  }

  if (!chatId) return NextResponse.json({ ok: true });

  // /verify (DM only)
  if ((text === "/verify" || text.startsWith("/verify ")) && chat?.type === "private") {
    const tgUserId = fromUser(update)?.id;

    if (!tgUserId) {
      await sendMessage(chatId, "Unable to identify your Telegram user.");
      return NextResponse.json({ ok: true });
    }

    const code = generateVerifyCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("dd_tg_verify_codes").insert({
      tg_user_id: tgUserId,
      code,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("[verify] insert failed:", error);
      await sendMessage(chatId, "Failed to generate verification code. Try again.");
      return NextResponse.json({ ok: true });
    }

    await sendMessage(
      chatId,
      `Terminal Pass Verification

Your verification code:
<b>${code}</b>

Expires in 10 minutes.

Go to https://digdug.do
Open the Terminal and type:

<code>verify ${code}</code>`
    );

    return NextResponse.json({ ok: true });
  }

  // /claim (DM OR GROUP) — public validation in group, secure details via DM
  if (text === "/claim" || text.startsWith("/claim ")) {
    const u = fromUser(update);
    const tgUserId = u?.id;
    const who = displayName(update);
    const isGroup = chat?.type === "group" || chat?.type === "supergroup";

    if (!tgUserId) {
      await sendMessage(chatId, "Unable to identify your Telegram user.");
      return NextResponse.json({ ok: true });
    }

    const parts = text.split(/\s+/).filter(Boolean);
    const claimCode = String(parts[1] ?? "").trim().toUpperCase();

    if (!claimCode || !claimCode.startsWith("GF-")) {
      await sendMessage(chatId, "Usage: /claim GF-XXXX");
      return NextResponse.json({ ok: true });
    }

    if (isGroup) {
      await sendMessage(chatId, `🏆 Claim attempt received: <b>${claimCode}</b> from <b>${who}</b>`);
    }

    // Must be verified
    const { data: links, error: linkErr } = await supabaseAdmin
      .from("dd_tg_verify_codes")
      .select("terminal_user_id")
      .eq("tg_user_id", tgUserId)
      .not("used_at", "is", null)
      .order("used_at", { ascending: false })
      .limit(1);

    if (linkErr) {
      console.error("[claim] verify lookup failed:", linkErr);
      if (isGroup) await sendMessage(chatId, `❌ ${who}: claim failed (server error).`);
      else await sendMessage(chatId, "Claim failed (server error). Try again later.");
      return NextResponse.json({ ok: true });
    }

    const terminalUserId = (links?.[0] as any)?.terminal_user_id;

    if (!terminalUserId) {
      const msg = `Verification required.

Step 1: DM @DigsterBot and type <code>/verify</code>
Step 2: enter the code in the Terminal:
<code>verify DG-XXXX</code>

Then retry:
<code>/claim ${claimCode}</code>`;

      // Prefer DM (works only if user started bot)
      try {
        await sendMessageChecked(Number(tgUserId), msg);
      } catch {
        await sendMessage(chatId, `⚠️ ${who}: you must verify first. DM @DigsterBot and run <code>/verify</code>.`);
      }

      return NextResponse.json({ ok: true });
    }

    // Fetch golden event
    const { data: evRows, error: evErr } = await supabaseAdmin
      .from("dd_tg_golden_events")
      .select("id, terminal_user_id, token, chain, usd_value")
      .eq("claim_code", claimCode)
      .limit(1);

    if (evErr) {
      console.error("[claim] event lookup failed:", evErr);
      await sendMessage(chatId, `❌ ${who}: claim failed (server error).`);
      return NextResponse.json({ ok: true });
    }

    const ev = evRows?.[0] as any;
    if (!ev?.id) {
      await sendMessage(chatId, `❌ ${who}: claim code not found.`);
      return NextResponse.json({ ok: true });
    }

    // Ensure belongs to this verified terminal user
    if (String(ev.terminal_user_id) !== String(terminalUserId)) {
      await sendMessage(chatId, `❌ ${who}: claim rejected (not your verified Terminal Pass).`);
      return NextResponse.json({ ok: true });
    }

    // Insert claim (unique per event) — store group_chat_id if claim was made in group
    const { error: insErr } = await supabaseAdmin.from("dd_tg_golden_claims").insert({
      golden_event_id: ev.id,
      tg_user_id: tgUserId,
      terminal_user_id: terminalUserId,
      group_chat_id: isGroup ? String(chatId) : null,
    });

    if (insErr) {
      const m = String((insErr as any)?.message ?? "").toLowerCase();
      if (m.includes("duplicate") || m.includes("unique")) {
        await sendMessage(chatId, `ℹ️ ${who}: already claimed.`);
        return NextResponse.json({ ok: true });
      }
      console.error("[claim] insert failed:", insErr);
      await sendMessage(chatId, `❌ ${who}: claim failed (server error).`);
      return NextResponse.json({ ok: true });
    }

    // DM the next steps
    const dm = `✅ Claim accepted.

Claim: ${claimCode}
Token: ${ev.token} (${ev.chain})
Value: $${Number(ev.usd_value).toFixed(2)}

NEXT:
Reply here with your payout address (USDT BEP-20) using:

<code>/usdt 0xYOURADDRESS</code>

After payment, you will receive a receipt confirmation.`;

    try {
      await sendMessageChecked(Number(tgUserId), dm);
      await sendMessage(chatId, `✅ ${who}: claim validated. Check DM for payout step.`);
    } catch {
      await sendMessage(chatId, `✅ ${who}: claim validated, but I couldn't DM you. Please DM @DigsterBot and send <code>/start</code>, then try again.`);
    }

    return NextResponse.json({ ok: true });
  }

  // /usdt (DM only) — store payout address + SAFE public confirmation (masked)
  if ((text === "/usdt" || text.startsWith("/usdt ")) && chat?.type === "private") {
    const tgUserId = fromUser(update)?.id;

    if (!tgUserId) {
      await sendMessage(chatId, "Unable to identify your Telegram user.");
      return NextResponse.json({ ok: true });
    }

    const parts = text.split(/\s+/).filter(Boolean);
    const addr = String(parts[1] ?? "").trim();

    if (!addr || !looksLikeEvmAddress(addr)) {
      await sendMessage(chatId, "Usage: /usdt 0xYOURADDRESS (USDT BEP-20)");
      return NextResponse.json({ ok: true });
    }

    // Find latest claim by this TG user
    const { data: claims, error: cErr } = await supabaseAdmin
      .from("dd_tg_golden_claims")
      .select("id, claimed_at, group_chat_id, golden_event_id")
      .eq("tg_user_id", tgUserId)
      .order("claimed_at", { ascending: false })
      .limit(1);

    if (cErr) {
      console.error("[usdt] claim lookup failed:", cErr);
      await sendMessage(chatId, "Could not store address (server error). Try again later.");
      return NextResponse.json({ ok: true });
    }

    const claim = claims?.[0] as any;
    if (!claim?.id) {
      await sendMessage(chatId, "No recent claim found. Claim a Golden Find first using /claim GF-XXXX.");
      return NextResponse.json({ ok: true });
    }

    const { error: uErr } = await supabaseAdmin.from("dd_tg_golden_claims").update({ payout_usdt_bep20: addr }).eq("id", claim.id);

    if (uErr) {
      console.error("[usdt] update failed:", uErr);
      await sendMessage(chatId, "Could not store address (server error). Try again later.");
      return NextResponse.json({ ok: true });
    }

    const masked = maskEvmAddress(addr);

    await sendMessage(
      chatId,
      `Payout address saved.

USDT (BEP-20): ${addr}

We will pay and then send you a receipt confirmation.`
    );

    // SAFE public confirmation (masked) back to the group where the claim occurred
    if (claim?.group_chat_id) {
      try {
        const who = displayName(update);
        await sendMessage(Number(claim.group_chat_id), `✅ Payout address received for <b>${who}</b>: <code>${masked}</code>`);
      } catch (e) {
        console.error("[usdt] public confirm failed:", e);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // /start
  if (text === "/start" || text.startsWith("/start ")) {
    await sendMessage(
      chatId,
      `Welcome to DIGSTER

Commands (DM):
- /verify
- /claim GF-XXXX
- /usdt 0xYOURADDRESS (USDT BEP-20)

Group:
- /claim GF-XXXX (public validation)
- /ping
- /chatid`
    );
    return NextResponse.json({ ok: true });
  }

  // /help
  if (text === "/help") {
    await sendMessage(
      chatId,
      `Commands:\n/verify\n/claim GF-XXXX\n/usdt 0xYOURADDRESS\n\nGroup: /claim GF-XXXX (public validation)\n/ping\n/chatid`
    );
    return NextResponse.json({ ok: true });
  }

  // /ping
  if (text === "/ping" || text.startsWith("/ping@")) {
    const type = chat?.type ?? "unknown";
    const title = chat?.title ? ` • ${chat.title}` : "";
    await sendMessage(chatId, `Digster online${title}\nchat_type=${type}`);
    return NextResponse.json({ ok: true });
  }

  // /chatid
  if (text === "/chatid" || text.startsWith("/chatid@")) {
    const type = chat?.type ?? "unknown";
    const title = chat?.title ? `\ntitle=${chat.title}` : "";
    await sendMessage(chatId, `chat_id=${chatId}\nchat_type=${type}${title}`);
    return NextResponse.json({ ok: true });
  }

  // Message-based join detection
  const msg = getMsg(update);
  const newMembers = msg?.new_chat_members;

  if (newMembers && Array.isArray(newMembers) && newMembers.length > 0) {
    if (chat?.type === "group" || chat?.type === "supergroup") {
      const graceMinutes = 10;
      const graceExpiresAt = new Date(Date.now() + graceMinutes * 60 * 1000).toISOString();

      for (const m of newMembers) {
        const tgUserId = m?.id;
        const isBot = !!m?.is_bot;
        if (!tgUserId || isBot) continue;

        const { error } = await supabaseAdmin
          .from("dd_tg_pending_joins")
          .upsert(
            {
              group_chat_id: String(chatId),
              tg_user_id: tgUserId,
              grace_expires_at: graceExpiresAt,
              warned_at: new Date().toISOString(),
              status: "PENDING",
            },
            { onConflict: "group_chat_id,tg_user_id" }
          );

        if (error) console.error("[tg] pending join upsert error:", error);

        await sendMessage(chatId, welcomeText(m?.first_name, graceMinutes), { replyMarkup: verifyButton() });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
