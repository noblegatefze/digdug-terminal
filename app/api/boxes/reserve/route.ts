import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

async function isReservePaused() {
  const { data } = await supabase
    .from("dd_admin_flags")
    .select("pause_all, pause_reserve")
    .eq("id", true)
    .single();

  return Boolean(data?.pause_all || data?.pause_reserve);
}

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
  // EMERGENCY PAUSE
  if (process.env.DIGDUG_PAUSE === "1") {
    return NextResponse.json({ ok: false, error: "Protocol temporarily paused." }, { status: 503 });
  }

  // ADMIN PANEL PAUSE
  if (await isReservePaused()) {
    return NextResponse.json({ ok: false, error: "reserve_paused" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);

  const username = String(body?.username ?? "").trim();
  const box_id = String(body?.box_id ?? "").trim();
  const dig_id = String(body?.dig_id ?? "").trim(); // REQUIRED for idempotency + linkage
  const amount = asNum(body?.amount);

  if (!username || !box_id || !dig_id || amount == null || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Missing/invalid fields" }, { status: 400 });
  }

  // ✅ Idempotency guard: if reserve already exists for (box_id, dig_id, username), return ok.
  // NOTE: rpc_dig_reserve should already be idempotent, but this makes the API stable.
  const { count: rcount, error: rerr } = await supabase
    .from("dd_box_ledger")
    .select("id", { head: true, count: "estimated" })
    .eq("box_id", box_id)
    .eq("entry_type", "claim_reserve")
    .filter("meta->>dig_id", "eq", dig_id)
    .filter("meta->>username", "eq", username);

  if (rerr) {
    return NextResponse.json({ ok: false, error: "reserve_lookup_failed" }, { status: 500 });
  }
  if ((rcount ?? 0) > 0) {
    return NextResponse.json({ ok: true, deduped: true, note: "reserve_already_exists" });
  }

  // Resolve cmc_id from box meta
  const { data: box, error: berr } = await supabase
    .from("dd_boxes")
    .select("id, meta")
    .eq("id", box_id)
    .single();

  if (berr || !box) {
    return NextResponse.json({ ok: false, error: "Box not found" }, { status: 404 });
  }

  const metaObj: any = (box as any)?.meta ?? {};
  const cmc_id = asInt(metaObj?.cmc_id);
  const price_usd_at_dig = cmc_id ? await fetchCmcUsdPrice(cmc_id) : null;
  const price_at = new Date().toISOString();

  // Atomic reserve + debit inside DB transaction
  // NOTE: DB now has a UNIQUE index on (box_id, meta->>'dig_id') for claim_reserve,
  // so repeated calls become safe (the RPC should handle conflict / idempotency).
  const { data, error } = await supabase.rpc("rpc_dig_reserve", {
    p_username: username,
    p_box_id: box_id,
    p_dig_id: dig_id,
    p_amount: amount,
    p_cmc_id: cmc_id,
    p_price_usd_at_dig: price_usd_at_dig,
    p_price_at: price_at,
  });

  if (error) {
    // If the RPC attempts to insert duplicate reserve rows, the DB unique index will block it.
    // We return a stable error message to the client.
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const out: any = data;
  if (!out?.ok) {
    return NextResponse.json(out ?? { ok: false, error: "reserve_failed" }, { status: 400 });
  }

  return NextResponse.json(out);
}
