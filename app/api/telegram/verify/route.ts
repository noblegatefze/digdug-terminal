import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const TELEGRAM_TOKEN = reqEnv("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const TG_GROUP_ID = reqEnv("TELEGRAM_GROUP_ID");

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const codeRaw = typeof body.code === "string" ? body.code.trim() : "";

  if (!username || !codeRaw) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  // Normalize like bot issues: DG-XXXX
  const code = codeRaw.toUpperCase();

  // 1) Fetch the code row (must be unused + unexpired)
  const { data: rows, error: qErr } = await supabaseAdmin
    .from("dd_tg_verify_codes")
    .select("id, tg_user_id, code, expires_at, used_at, terminal_user_id")
    .eq("code", code)
    .limit(1);

  if (qErr) {
    console.error("[tg verify] query error:", qErr);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  const row = rows?.[0];
  if (!row) {
    return NextResponse.json({ ok: false, error: "code_not_found" }, { status: 404 });
  }

  if (row.used_at) {
    return NextResponse.json({ ok: false, error: "code_already_used" }, { status: 400 });
  }

  const expiresAtMs = Date.parse(row.expires_at);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
    return NextResponse.json({ ok: false, error: "code_expired" }, { status: 400 });
  }

  // 2) Fetch terminal user id for username
  // NOTE: adjust table/column names if your auth table differs
  const { data: users, error: uErr } = await supabaseAdmin
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .limit(1);

  if (uErr) {
    console.error("[tg verify] user query error:", uErr);
    return NextResponse.json({ ok: false, error: "user_query_failed" }, { status: 500 });
  }

  const user = users?.[0];
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "terminal_user_not_found" }, { status: 404 });
  }

  // 3) Mark code as used + attach terminal_user_id
  const nowIso = new Date().toISOString();
  const { error: upErr } = await supabaseAdmin
    .from("dd_tg_verify_codes")
    .update({
      used_at: nowIso,
      terminal_user_id: user.id,
    })
    .eq("id", row.id);

  if (upErr) {
    console.error("[tg verify] update error:", upErr);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  // 4) Announce verification in group (fire-and-forget)
  try {
    await tgCall("sendMessage", {
      chat_id: TG_GROUP_ID,
      text: `✅ ${username} has verified their Terminal Pass.`,
      disable_web_page_preview: true,
    });
  } catch {
    // never block verification on TG issues
  }

  // 5) Unrestrict user in group (unmute after verify)
  try {
    await tgCall("restrictChatMember", {
      chat_id: TG_GROUP_ID,
      user_id: row.tg_user_id,
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
      },
    });
  } catch (e) {
    console.error("[tg verify] unrestrict failed:", e);
    // never block verification; user can be handled manually if TG API fails
  }

  return NextResponse.json({
    ok: true,
    username,
    tg_user_id: row.tg_user_id,
    terminal_user_id: user.id,
    code,
  });
}
