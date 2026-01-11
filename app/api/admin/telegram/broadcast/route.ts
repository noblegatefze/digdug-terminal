import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function requireAdmin(req: NextRequest) {
  const got = req.headers.get("x-admin-key") || "";
  const expected = reqEnv("ADMIN_API_KEY");
  return !!got && got === expected;
}

const supabaseAdmin = createClient(
  reqEnv("SUPABASE_URL"),
  reqEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

const TELEGRAM_TOKEN = reqEnv("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

type ChatRow = {
  chat_id: string; // bigint from DB (often returned as string)
  chat_type: string | null;
  title: string | null;
  username: string | null;
  last_seen_at: string | null;
  created_at: string | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tgSendMessage(chatId: string, text: string) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const json = await res.json().catch(() => ({}));

  // Telegram errors still often return 200 with ok:false
  if (!res.ok || json?.ok === false) {
    const err: any = new Error("telegram_send_failed");
    err.status = res.status;
    err.tg = json;
    throw err;
  }

  return json;
}

async function sendWithBackoff(chatId: string, text: string) {
  // Basic safe behavior:
  // - if rate limited, wait and retry
  // - if bot blocked / chat not found, mark failed and continue (no retry)
  try {
    await tgSendMessage(chatId, text);
    return { ok: true as const };
  } catch (e: any) {
    const tg = e?.tg;
    const desc: string = tg?.description || "";

    // 429 Too Many Requests: Telegram often includes retry_after in parameters
    const retryAfter = tg?.parameters?.retry_after;
    if (e?.status === 429 || retryAfter) {
      const waitSec = typeof retryAfter === "number" ? retryAfter : 2;
      await sleep((waitSec + 1) * 1000);
      // one retry
      try {
        await tgSendMessage(chatId, text);
        return { ok: true as const, retried: true as const };
      } catch (e2: any) {
        return { ok: false as const, error: "rate_limited_retry_failed", detail: e2?.tg?.description || null };
      }
    }

    // Common non-retryable cases
    if (desc.includes("bot was blocked by the user")) {
      return { ok: false as const, error: "blocked_by_user", detail: desc };
    }
    if (desc.includes("chat not found")) {
      return { ok: false as const, error: "chat_not_found", detail: desc };
    }
    if (desc.includes("not enough rights") || desc.includes("Forbidden")) {
      return { ok: false as const, error: "forbidden", detail: desc };
    }

    return { ok: false as const, error: "send_failed", detail: desc || null };
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // mode: "dry_run" (default) or "send"
  const mode: "dry_run" | "send" = body.mode === "send" ? "send" : "dry_run";

  // message required for send mode; optional for dry-run
  const message: string = typeof body.message === "string" ? body.message : "";

  // Safety: default to groups only (your request)
  const includeTypes: string[] = Array.isArray(body.includeTypes) ? body.includeTypes : ["group", "supergroup"];

  // Optional: only active recently
  const activeWithinHours: number | null =
    typeof body.activeWithinHours === "number" ? body.activeWithinHours : null;

  const limit: number = typeof body.limit === "number" ? Math.max(1, Math.min(5000, body.limit)) : 5000;

  // Rate limiting controls
  // Conservative default: 1 msg / 300ms (~3.3/sec)
  const delayMs: number = typeof body.delayMs === "number" ? Math.max(80, body.delayMs) : 300;

  // Hard safety cap per request
  const maxSend: number = typeof body.maxSend === "number" ? Math.max(1, Math.min(1000, body.maxSend)) : 250;

  let q = supabaseAdmin
    .from("dd_tg_chats")
    .select("chat_id, chat_type, title, username, last_seen_at, created_at")
    .order("last_seen_at", { ascending: false })
    .limit(limit);

  if (includeTypes.length > 0) {
    q = q.in("chat_type", includeTypes);
  }

  if (activeWithinHours != null) {
    const cutoff = new Date(Date.now() - activeWithinHours * 3600 * 1000).toISOString();
    q = q.gte("last_seen_at", cutoff);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[broadcast] query error:", error);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  const rows = ((data || []) as ChatRow[]).map((r) => ({
    ...r,
    chat_id: String(r.chat_id),
  }));

  const byType: Record<string, number> = {};
  for (const r of rows) {
    const t = r.chat_type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
  }

  const sample = rows.slice(0, 10).map((r) => ({
    chat_id: r.chat_id,
    chat_type: r.chat_type,
    title: r.title,
    username: r.username,
    last_seen_at: r.last_seen_at,
  }));

  if (mode === "dry_run") {
    return NextResponse.json({
      ok: true,
      mode: "dry_run",
      filters: {
        includeTypes: includeTypes.length ? includeTypes : null,
        activeWithinHours,
        limit,
      },
      counts: {
        total: rows.length,
        byType,
        // informational
        plannedDelayMs: delayMs,
        maxSend,
      },
      sample,
    });
  }

  // SEND MODE SAFETY
  if (!message.trim()) {
    return NextResponse.json({ ok: false, error: "message_required" }, { status: 400 });
  }

  const targets = rows.slice(0, Math.min(rows.length, maxSend));

  const results: any[] = [];
  let sent = 0;
  let failed = 0;
  let retried = 0;

  for (const r of targets) {
    const out = await sendWithBackoff(r.chat_id, message);
    results.push({
      chat_id: r.chat_id,
      chat_type: r.chat_type,
      title: r.title,
      ok: out.ok,
      error: out.ok ? null : out.error,
      detail: out.ok ? null : out.detail,
      retried: (out as any).retried === true,
    });

    if (out.ok) {
      sent += 1;
      if ((out as any).retried) retried += 1;
    } else {
      failed += 1;
    }

    await sleep(delayMs);
  }

  return NextResponse.json({
    ok: true,
    mode: "send",
    counts: {
      requestedTotal: rows.length,
      attempted: targets.length,
      sent,
      failed,
      retried,
      delayMs,
      maxSend,
    },
    // keep results small by default
    resultsPreview: results.slice(0, 25),
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/admin/telegram/broadcast",
    modes: ["dry_run", "send"],
    defaultIncludeTypes: ["group", "supergroup"],
  });
}
