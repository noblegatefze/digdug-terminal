import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function asNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const username = String(body?.username ?? "").trim();
  const box_id = String(body?.box_id ?? "").trim();

  // amount is the ONLY value we accept from the client for claim creation
  const amount = asNum(body?.amount);

  if (!username || !box_id || amount == null || amount <= 0) {
    return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
  }

  // 1) lookup user_id by username
  const { data: user, error: uerr } = await supabase
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (uerr || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2) lookup box config from DB (authoritative)
  const { data: box, error: berr } = await supabase
    .from("dd_boxes")
    .select("id, deploy_chain_id, token_address, token_symbol")
    .eq("id", box_id)
    .single();

  if (berr || !box) {
    return NextResponse.json({ error: "Box not found" }, { status: 404 });
  }

  const chain_id = String(box.deploy_chain_id ?? "").trim();
  const token_address = String(box.token_address ?? "").trim();
  const token_symbol = String(box.token_symbol ?? "").trim();

  if (!chain_id || !token_address || !token_symbol) {
    return NextResponse.json({ error: "Box not configured" }, { status: 400 });
  }

  // 3) insert claim (server-resolved chain/token fields)
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
