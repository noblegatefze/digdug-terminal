import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabaseAdmin = createClient(
  reqEnv("SUPABASE_URL"),
  reqEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

// simple sleep for rate safety
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function kickUser(chatId: string, tgUserId: number) {
  const res = await fetch(`${TELEGRAM_API}/banChatMember`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      user_id: tgUserId,
      revoke_messages: false,
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export async function GET() {
  const nowIso = new Date().toISOString();

  // 1) Fetch expired, still-pending joins
  const { data: rows, error } = await supabaseAdmin
    .from("dd_tg_pending_joins")
    .select("id, group_chat_id, tg_user_id")
    .eq("status", "PENDING")
    .lt("grace_expires_at", nowIso)
    .limit(25); // safety cap per run

  if (error) {
    console.error("[tg-enforce] query error:", error);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let kicked = 0;
  let skipped = 0;

  for (const row of rows) {
    const { id, group_chat_id, tg_user_id } = row;

    // 2) Check if this TG user is already verified
    const { data: verified } = await supabaseAdmin
      .from("dd_tg_verify_codes")
      .select("id")
      .eq("tg_user_id", tg_user_id)
      .not("used_at", "is", null)
      .limit(1);

    if (verified && verified.length > 0) {
      // mark as verified, no action
      await supabaseAdmin
        .from("dd_tg_pending_joins")
        .update({
          status: "VERIFIED",
          checked_at: nowIso,
        })
        .eq("id", id);

      skipped++;
      continue;
    }

    // 3) Kick user
    const res = await kickUser(group_chat_id, tg_user_id);

    if (!res.ok) {
      console.error("[tg-enforce] kick failed:", res.json);
      skipped++;
      continue;
    }

    // 4) Mark as kicked
    await supabaseAdmin
      .from("dd_tg_pending_joins")
      .update({
        status: "KICKED",
        kicked_at: nowIso,
        checked_at: nowIso,
      })
      .eq("id", id);

    kicked++;
    await sleep(500); // rate safety
  }

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    kicked,
    skipped,
  });
}
