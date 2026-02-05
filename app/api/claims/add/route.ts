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

async function hasReserve(box_id: string, dig_id: string, username: string): Promise<boolean> {
  // SUPER LIGHTWEIGHT existence check:
  // - HEAD request (no rows returned)
  // - exact count just to know if any exists
  //
  // Uses PostgREST JSON path filter: meta->>dig_id = <dig_id>
  // and also meta->>username = <username> to prevent reusing someone else's dig_id.
  const { count, error } = await supabase
    .from("dd_box_ledger")
    .select("id", { head: true, count: "exact" })
    .eq("box_id", box_id)
    .eq("entry_type", "claim_reserve")
    .filter("meta->>dig_id", "eq", dig_id)
    .filter("meta->>username", "eq", username);

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function claimAlreadyExists(box_id: string, dig_id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("dd_treasure_claims")
    .select("id", { head: true, count: "exact" })
    .eq("box_id", box_id)
    .eq("dig_id", dig_id);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const username = String(body?.username ?? "").trim();
  const box_id = String(body?.box_id ?? "").trim();
  const dig_id = String(body?.dig_id ?? "").trim(); // linkage key (box_id + dig_id)
  const amount = asNum(body?.amount); // ONLY numeric accepted from client

  if (!username || !box_id || !dig_id || amount == null || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Missing/invalid fields" }, { status: 400 });
  }

  // 1) lookup user_id by username
  const { data: user, error: uerr } = await supabase
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (uerr || !user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  // 2) lookup box config from DB (authoritative)
  const { data: box, error: berr } = await supabase
    .from("dd_boxes")
    .select("id, deploy_chain_id, token_address, token_symbol")
    .eq("id", box_id)
    .single();

  if (berr || !box) {
    return NextResponse.json({ ok: false, error: "Box not found" }, { status: 404 });
  }

  const chain_id = String(box.deploy_chain_id ?? "").trim();
  const token_address = String(box.token_address ?? "").trim();
  const token_symbol = String(box.token_symbol ?? "").trim();

  if (!chain_id || !token_address || !token_symbol) {
    return NextResponse.json({ ok: false, error: "Box not configured" }, { status: 400 });
  }

  // 3) ENFORCE: reserve must exist BEFORE claim insert
  // This blocks "claim without reserve" permanently.
  try {
    const okReserve = await hasReserve(box_id, dig_id, username);

    if (!okReserve) {
      // Idempotency edge: if the claim already exists (client retry),
      // return ok rather than blocking. (Does not create new damage.)
      const already = await claimAlreadyExists(box_id, dig_id);
      if (already) return NextResponse.json({ ok: true, deduped: true, note: "claim_already_exists" });

      return NextResponse.json(
        {
          ok: false,
          code: "RESERVE_REQUIRED",
          error: "Missing matching claim_reserve for (box_id, dig_id). Claim blocked.",
          box_id,
          dig_id,
        },
        { status: 409 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Reserve check failed", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }

  // 4) insert claim (server-resolved chain/token fields) with dig_id
  // DB has UNIQUE index on (box_id, dig_id) where dig_id is not null
  const { error } = await supabase.from("dd_treasure_claims").insert({
    user_id: user.id,
    username: user.username,
    box_id,
    dig_id,
    chain_id,
    token_address,
    token_symbol,
    amount,
    status: "CLAIMED",
  });

  if (error) {
    const code = (error as any)?.code;
    if (code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
