import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function asInt(v: any): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

/**
 * CMC price cache (per cmc_id)
 * - MEMORY_TTL_SECONDS is the main throttle (start high to save credits)
 * - inflight dedupe prevents stampede when many users hit at once
 */
const MEMORY_TTL_SECONDS = 180; // 3 minutes (adjust later if needed)
type CacheEntry = { price: number | null; at: number; cmc_id: number };
const mem = new Map<number, CacheEntry>();
const inflight = new Map<number, Promise<number | null>>();

async function fetchCmcUsdPrice(cmcId: number): Promise<number | null> {
  const key = process.env.COINMARKETCAP_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);

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
      // Important: do not rely on fetch caching here; we do our own cache + CDN headers.
      cache: "no-store",
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

function freshEnough(entry: CacheEntry) {
  const ageSec = (Date.now() - entry.at) / 1000;
  return ageSec <= MEMORY_TTL_SECONDS;
}

async function getPriceCached(cmcId: number): Promise<{ price: number | null; price_at: string; from_cache: boolean }> {
  // 1) Memory cache (fast path)
  const hit = mem.get(cmcId);
  if (hit && freshEnough(hit)) {
    return { price: hit.price, price_at: new Date(hit.at).toISOString(), from_cache: true };
  }

  // 2) Inflight dedupe (stampede protection)
  const existing = inflight.get(cmcId);
  if (existing) {
    const p = await existing;
    const now = Date.now();
    // even if null, cache the null briefly to avoid repeated hammering when CMC is down
    mem.set(cmcId, { price: p, at: now, cmc_id: cmcId });
    return { price: p, price_at: new Date(now).toISOString(), from_cache: true };
  }

  const task = (async () => {
    const p = await fetchCmcUsdPrice(cmcId);
    return p;
  })();

  inflight.set(cmcId, task);

  try {
    const p = await task;
    const now = Date.now();

    // Fail-open: if CMC fails, keep last known price (if any) instead of returning null.
    const finalPrice = p ?? mem.get(cmcId)?.price ?? null;

    mem.set(cmcId, { price: finalPrice, at: now, cmc_id: cmcId });
    return { price: finalPrice, price_at: new Date(now).toISOString(), from_cache: false };
  } finally {
    inflight.delete(cmcId);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const box_id = String(url.searchParams.get("box_id") ?? "").trim();
  if (!box_id) return NextResponse.json({ ok: false, error: "missing_box_id" }, { status: 400 });

  const { data: box, error } = await supabase
    .from("dd_boxes")
    .select("id, meta")
    .eq("id", box_id)
    .single();

  if (error || !box) return NextResponse.json({ ok: false, error: "box_not_found" }, { status: 404 });

  const metaObj: any = (box as any)?.meta ?? {};
  const cmc_id = asInt(metaObj?.cmc_id);

  // If no cmc_id, return quickly (and cache at CDN level anyway).
  if (!cmc_id) {
    const res = NextResponse.json({ ok: true, box_id, cmc_id: null, price_usd: null, price_at: new Date().toISOString() });
    res.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600"); // 10m CDN cache
    return res;
  }

  const { price, price_at, from_cache } = await getPriceCached(cmc_id);

  const res = NextResponse.json({
    ok: true,
    box_id,
    cmc_id,
    price_usd: price,
    price_at,
    from_cache,
    ttl_seconds: MEMORY_TTL_SECONDS,
  });

  // CDN cache: huge credit saver (most repeated requests won't reach this function)
  // We match the in-memory TTL to avoid confusion.
  res.headers.set("Cache-Control", `public, s-maxage=${MEMORY_TTL_SECONDS}, stale-while-revalidate=600`);
  return res;
}
