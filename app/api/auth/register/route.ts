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

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

/** ---------------------------------------
 * CAPTCHA PASS ENFORCEMENT (server-side)
 * --------------------------------------*/
async function requireCaptchaPassForRegister(args: {
  username: string;
  install_id: string;
  captcha_pass_id: string;
}) {
  const { username, install_id, captcha_pass_id } = args;

  const { data: pass, error } = await supabase
    .from("dd_captcha_passes")
    .select("*")
    .eq("id", captcha_pass_id)
    .single();

  if (error || !pass) return { ok: false as const, error: "captcha_pass_not_found" };

  if (String(pass.purpose) !== "REGISTER" || String(pass.username) !== username || String(pass.install_id) !== install_id) {
    return { ok: false as const, error: "captcha_pass_scope_mismatch" };
  }

  const exp = new Date(String(pass.expires_at)).getTime();
  if (!Number.isFinite(exp) || Date.now() > exp) return { ok: false as const, error: "captcha_pass_expired" };

  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const username = String(body?.username ?? "").trim();
    const install_id = String(body?.install_id ?? "").trim();
    const captcha_pass_id = String(body?.captcha_pass_id ?? "").trim();

    if (!username || username.length < 3) {
      return NextResponse.json({ ok: false, error: "invalid_username" }, { status: 400 });
    }

    // captcha required for register
    if (!install_id || !captcha_pass_id) {
      return NextResponse.json({ ok: false, error: "captcha_required" }, { status: 403 });
    }

    const gate = await requireCaptchaPassForRegister({ username, install_id, captcha_pass_id });
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.error }, { status: 403 });
    }

    // simple pass hash (Phase Zero)
    const pass = crypto.randomBytes(4).toString("hex");
    const passHash = crypto.createHash("sha256").update(pass).digest("hex");

    const { error } = await supabase
      .from("dd_terminal_users")
      .insert({
        username,
        pass_hash: passHash,
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        return NextResponse.json({ ok: false, error: "username_taken" }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      username,
      terminal_pass: pass,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}
