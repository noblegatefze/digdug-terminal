import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const PASS_TTL_MS = 30 * 60_000; // 30 min
const PASS_DIGS = 10;

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}
function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as any;

  const challenge_id = String(body?.challenge_id ?? "").trim();
  const answer = String(body?.answer ?? "");
  const purpose = String(body?.purpose ?? "").toUpperCase();
  const username = String(body?.username ?? "").trim();
  const install_id = String(body?.install_id ?? "").trim();

  if (!challenge_id) return NextResponse.json({ ok: false, error: "missing_challenge_id" }, { status: 400 });
  if (purpose !== "REGISTER" && purpose !== "DIG") return NextResponse.json({ ok: false, error: "bad_purpose" }, { status: 400 });
  if (!username || username.length < 3) return NextResponse.json({ ok: false, error: "bad_username" }, { status: 400 });
  if (!install_id || install_id.length < 6) return NextResponse.json({ ok: false, error: "bad_install_id" }, { status: 400 });

  const { data: ch, error: e1 } = await sb
    .from("dd_captcha_challenges")
    .select("*")
    .eq("id", challenge_id)
    .single();

  if (e1 || !ch) return NextResponse.json({ ok: false, error: "challenge_not_found" }, { status: 404 });

  if (String(ch.purpose) !== purpose || String(ch.username) !== username || String(ch.install_id) !== install_id) {
    return NextResponse.json({ ok: false, error: "challenge_scope_mismatch" }, { status: 403 });
  }

  if (Boolean(ch.solved)) return NextResponse.json({ ok: false, error: "already_solved" }, { status: 400 });

  const exp = new Date(String(ch.expires_at)).getTime();
  if (!Number.isFinite(exp) || Date.now() > exp) return NextResponse.json({ ok: false, error: "expired" }, { status: 400 });

  const attempts = Number(ch.attempts ?? 0);
  const maxAttempts = Number(ch.max_attempts ?? 4);

  if (attempts >= maxAttempts) return NextResponse.json({ ok: false, error: "max_attempts" }, { status: 429 });

  const expected = String(ch.answer_hash);
  const got = sha256(`${norm(answer)}|${username}|${install_id}|${purpose}`);

  const nextAttempts = attempts + 1;

  if (got !== expected) {
    await sb
      .from("dd_captcha_challenges")
      .update({ attempts: nextAttempts })
      .eq("id", challenge_id);

    return NextResponse.json({ ok: false, error: "incorrect", attempts: nextAttempts, max_attempts: maxAttempts });
  }

  // mark solved
  await sb
    .from("dd_captcha_challenges")
    .update({ solved: true, attempts: nextAttempts })
    .eq("id", challenge_id);

  // issue pass
  const expiresAt = new Date(Date.now() + PASS_TTL_MS).toISOString();
  const digsLeft = purpose === "DIG" ? PASS_DIGS : 0;

  const { data: pass, error: e2 } = await sb
    .from("dd_captcha_passes")
    .insert({
      purpose,
      username,
      install_id,
      expires_at: expiresAt,
      digs_left: digsLeft,
    })
    .select("id, expires_at, digs_left")
    .single();

  if (e2 || !pass) return NextResponse.json({ ok: false, error: e2?.message ?? "pass_issue_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, pass_id: pass.id, expires_at: pass.expires_at, digs_left: pass.digs_left });
}
