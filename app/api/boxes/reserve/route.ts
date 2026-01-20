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

function asInt(v: any): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

async function fetchCmcUsdPrice(cmcId: number): Promise<number | null> {
  const key = process.env.COINMARKETCAP_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const url =
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest` +
      `?id=${encodeURIComponent(String(cmcId))}&convert=USD`;

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "X-CMC_PRO_API_KEY": key,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!r.ok) return null;

    const j: any = await r.json().catch(() => null);
    const p = j?.data?.[String(cmcId)]?.quote?.USD?.price;
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
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

  // 2) resolve box token/chain + status (+ meta for cmc_id)
  const { data: box, error: berr } = await supabase
    .from("dd_boxes")
    .select("id,status,deploy_chain_id,token_address,token_symbol,meta")
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

  // 5) optional: CMC price-at-dig-time (only if meta.cmc_id + API key exist)
  const metaObj: any = (box as any)?.meta ?? {};
  const cmc_id = asInt(metaObj?.cmc_id);
  const price_usd_at_dig = cmc_id ? await fetchCmcUsdPrice(cmc_id) : null;
  const price_at = new Date().toISOString();

  // 6) insert reserve ledger entry
  const { error: ierr } = await supabase.from("dd_box_ledger").insert({
    box_id,
    entry_type: "claim_reserve",
    amount,
    chain_id: String((box as any).deploy_chain_id ?? null),
    token_address: String((box as any).token_address ?? null),
    meta: {
      dig_id,
      username: user.username,
      user_id: user.id,
      source: "dig",
      token_symbol: (box as any).token_symbol ?? null,

      // pricing (v0.1.16.2)
      cmc_id: cmc_id ?? null,
      price_source: cmc_id ? "cmc" : null,
      price_usd_at_dig: price_usd_at_dig ?? null,
      price_at,
    },
  });

  if (ierr) {
    return NextResponse.json({ ok: false, error: ierr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, already: false });
}
