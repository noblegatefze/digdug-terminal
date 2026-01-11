import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    username,
    box_id,
    chain_id,
    token_address,
    token_symbol,
    amount,
  } = body ?? {};

  if (!username || !box_id || !chain_id || !token_address || !token_symbol || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // lookup user_id by username
  const { data: user, error: uerr } = await supabase
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (uerr || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await supabase.from("dd_treasure_claims").insert({
    user_id: user.id,
    username: user.username,
    box_id,
    chain_id,
    token_address,
    token_symbol,
    amount,
    status: "CLAIMED",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
