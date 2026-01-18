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
  const dig_id = String(body?.dig_id ?? "").trim(); // REQUIRED for idempotency
  const amount = asNum(body?.amount);

  if (!username || !box_id || !dig_id || amount == null || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Missing/invalid fields" }, { status: 400 });
  }

  // 1) resolve user
  const { data: user, error: uerr } = await supabase
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (uerr || !user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  // 2) resolve box token/chain + status
  const { data: box, error: berr } = await supabase
    .from("dd_boxes")
    .select("id,status,deploy_chain_id,token_address,token_symbol")
    .eq("id", box_id)
    .single();

  if (berr || !box) {
    return NextResponse.json({ ok: false, error: "Box not found" }, { status: 404 });
  }
  if (String(box.status) !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Box inactive" }, { status: 400 });
  }

  // 3) idempotency: if a reserve already exists for this dig_id, no-op
  const { data: existing } = await supabase
    .from("dd_box_ledger")
    .select("id")
    .eq("box_id", box_id)
    .eq("entry_type", "claim_reserve")
    .contains("meta", { dig_id })
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, already: true });
  }

  // 4) sanity: ensure enough available balance (based on current ledger rollup)
  const { data: accRows } = await supabase
    .from("dd_box_accounting")
    .select("box_id,deposited_total,withdrawn_total,claimed_unwithdrawn")
    .eq("box_id", box_id)
    .limit(1);

  const acc = accRows?.[0];
  const deposited = Number(acc?.deposited_total ?? 0);
  const withdrawn = Number(acc?.withdrawn_total ?? 0);
  const reserved = Number(acc?.claimed_unwithdrawn ?? 0);
  const available = deposited - withdrawn - reserved;

  if (amount > available + 1e-9) {
    return NextResponse.json(
      { ok: false, error: "insufficient_box_balance", available },
      { status: 400 }
    );
  }

  // 5) insert reserve ledger entry
  const { error: ierr } = await supabase.from("dd_box_ledger").insert({
    box_id,
    entry_type: "claim_reserve",
    amount,
    chain_id: String(box.deploy_chain_id ?? null),
    token_address: String(box.token_address ?? null),
    meta: {
      dig_id,
      username: user.username,
      user_id: user.id,
      source: "dig",
      token_symbol: box.token_symbol ?? null,
    },
  });

  if (ierr) {
    return NextResponse.json({ ok: false, error: ierr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, already: false });
}
