import { supabaseAdmin } from "./supabaseAdmin";

export async function requireCaptchaPass(args: {
  purpose: "REGISTER" | "DIG";
  username: string;
  install_id: string;
  pass_id: string;
  consume_dig?: boolean;
}) {
  const { purpose, username, install_id, pass_id, consume_dig } = args;

  const { data: pass, error } = await supabaseAdmin
    .from("dd_captcha_passes")
    .select("*")
    .eq("id", pass_id)
    .single();

  if (error || !pass) return { ok: false as const, error: "captcha_pass_not_found" };

  if (pass.purpose !== purpose || pass.username !== username || pass.install_id !== install_id) {
    return { ok: false as const, error: "captcha_pass_scope_mismatch" };
  }

  const now = Date.now();
  const exp = new Date(pass.expires_at).getTime();
  if (now > exp) return { ok: false as const, error: "captcha_pass_expired" };

  if (purpose === "DIG" && consume_dig) {
    const left = Number(pass.digs_left ?? 0);
    if (left <= 0) return { ok: false as const, error: "captcha_pass_empty" };

    // decrement digs_left atomically
    const { error: e2 } = await supabaseAdmin
      .from("dd_captcha_passes")
      .update({ digs_left: left - 1 })
      .eq("id", pass_id);

    if (e2) return { ok: false as const, error: "captcha_pass_decrement_failed" };
  }

  return { ok: true as const };
}
