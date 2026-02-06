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
    .select("id", { head: true, count: "estimated" })
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
    .select("id", { head: true, count: "estimated" })
    .eq("box_id", box_id)
    .eq("dig_id", dig_id);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Tier by USD (canonical for DB)
 * Bands (from your UI): <1, <4, <10, <25, else mega
 */
function findTierByUsd(realUsd: number) {
  if (!Number.isFinite(realUsd) || realUsd < 0) return "FIND";
  if (realUsd < 1) return "BASE FIND";
  if (realUsd < 4) return "LOW FIND";
  if (realUsd < 10) return "MEDIUM FIND";
  if (realUsd < 25) return "HIGH FIND";
  return "MEGA FIND";
}

/**
 * Get latest address-based USD price for (chain_id, token_address).
 * Returns null if not found. Best-effort only.
 */
async function getLatestAddrPriceUsd(chain_id: string, token_address: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("dd_token_price_snapshots_addr")
    .select("price_usd, as_of")
    .eq("chain_id", chain_id)
    .eq("token_address", token_address)
    .order("as_of", { ascending: false })
    .limit(1);

  if (error) return null;
  const row = data?.[0];
  const price = row ? Number(row.price_usd) : NaN;
  return Number.isFinite(price) ? price : null;
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

  const chain_id = String(box.deploy_chain_id ?? "").trim().toUpperCase();
  const token_address = String(box.token_address ?? "").trim();
  const token_symbol = String(box.token_symbol ?? "").trim().toUpperCase();

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

  // 4) Compute USD + tier (best-effort; never blocks claim)
  let price_usd: number | null = null;
  let reward_usd: number | null = null;
  let find_tier: string = "FIND";
  const is_golden = false; // golden overlay will be set by golden flow

  try {
    price_usd = await getLatestAddrPriceUsd(chain_id, token_address);
    if (price_usd !== null) {
      reward_usd = amount * price_usd;
      find_tier = findTierByUsd(reward_usd);
    }
  } catch {
    // best-effort only
  }

  // 5) insert claim (server-resolved chain/token fields) with dig_id
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
    find_tier,
    is_golden,
  });

  if (error) {
    const code = (error as any)?.code;
    if (code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, find_tier, is_golden, price_usd, reward_usd });
}
