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

async function fetchCmcUsdPrice(cmcId: number): Promise<{ price: number | null; debug: any | null }> {
  const key = process.env.COINMARKETCAP_API_KEY;
  if (!key) return { price: null, debug: { reason: "missing_api_key" } };

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

    const text = await r.text().catch(() => "");
    let j: any = null;
    try {
      j = text ? JSON.parse(text) : null;
    } catch {
      j = null;
    }

    if (!r.ok) {
      return {
        price: null,
        debug: {
          status: r.status,
          statusText: r.statusText,
          body: j ?? text?.slice(0, 400),
        },
      };
    }

    const p = j?.data?.[String(cmcId)]?.quote?.USD?.price;
    const n = Number(p);

    if (Number.isFinite(n) && n > 0) {
      return { price: n, debug: null };
    }

    return {
      price: null,
      debug: {
        status: r.status,
        reason: "price_missing_or_invalid",
        body: j ?? text?.slice(0, 400),
      },
    };
  } catch (e: any) {
    return { price: null, debug: { reason: "exception", message: String(e?.message ?? e) } };
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
    return NextResponse.json({ ok: true, box_id, cmc_id: null, price_usd: null, debug: null });
  }

  const out = await fetchCmcUsdPrice(cmc_id);

  return NextResponse.json({
    ok: true,
    box_id,
    cmc_id,
    price_usd: out.price,
    price_at: new Date().toISOString(),
    debug: out.debug,
  });
}
