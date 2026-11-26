import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { username, terminal_pass } = await req.json();

  if (!username || !terminal_pass) {
    return NextResponse.json({ error: "Missing username or pass" }, { status: 400 });
  }

  const passHash = crypto.createHash("sha256").update(String(terminal_pass)).digest("hex");

  const { data, error } = await supabase
    .from("dd_terminal_users")
    .select("id, username, pass_hash, twofa_enabled, twofa_seed")
    .eq("username", username)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (data.pass_hash !== passHash) {
    return NextResponse.json({ error: "Invalid pass" }, { status: 401 });
  }

  const [enrollment, backer] = await Promise.all([
    supabase.from("fund_authenticator_credentials")
      .select("terminal_user_id").eq("terminal_user_id", data.id).maybeSingle(),
    supabase.from("fund_positions")
      .select("id").eq("terminal_user_id", data.id).gt("funded_usdt", 0).limit(1).maybeSingle(),
  ]);

  const migration = enrollment.error ? "unavailable" : enrollment.data ? "migrated" : "pending";
  const legacyBadge = backer.error ? null : backer.data ? "Legacy Backer Badge" : "Legacy Badge";

  return NextResponse.json({
    ok: true,
    migration,
    legacyBadge,
    user: {
      id: data.id,
      username: data.username,
      twofa_enabled: data.twofa_enabled,
      twofa_seed: data.twofa_seed ?? null,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
