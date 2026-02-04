import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function isAuthed(req: NextRequest) {
  return Boolean(req.cookies.get("dd_admin")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const username = String(searchParams.get("username") ?? "").trim();
  if (!username) return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });

  try {
    const { data: user, error: uErr } = await supabase
      .from("dd_terminal_users")
      .select("id, username, created_at")
      .eq("username", username)
      .maybeSingle();

    if (uErr) throw new Error(uErr.message);
    if (!user) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });

    const [stateRes, spendsRes, claimsRes] = await Promise.all([
      supabase.from("dd_user_state").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("dd_usddd_spend_ledger")
        .select("created_at, spend_type, box_id, usddd_amount, from_bucket, allocated_debit, acquired_debit, meta")
        .eq("terminal_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("dd_treasure_claims")
        .select("created_at, box_id, dig_id, chain_id, token_symbol, amount, status, withdrawn_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (stateRes.error) throw new Error(stateRes.error.message);
    if (spendsRes.error) throw new Error(spendsRes.error.message);
    if (claimsRes.error) throw new Error(claimsRes.error.message);

    return NextResponse.json({
      ok: true,
      user,
      state: stateRes.data ?? null,
      spends: spendsRes.data ?? [],
      claims: claimsRes.data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "user_failed" }, { status: 500 });
  }
}
