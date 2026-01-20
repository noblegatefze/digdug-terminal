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

  if (!cmc_id) {
    return NextResponse.json({ ok: true, box_id, cmc_id: null, price_usd: null });
  }

  const price = await fetchCmcUsdPrice(cmc_id);

  return NextResponse.json({
    ok: true,
    box_id,
    cmc_id,
    price_usd: price,
    price_at: new Date().toISOString(),
  });
}
