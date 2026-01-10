import { NextResponse } from "next/server";

const ALLOWED_EVENTS = new Set([
  "session_start",
  "dig_attempt",
  "dig_success",
  "withdraw",
  "box_create",
  "box_activate",
]);

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const MOCK_USD_PRICE: Record<string, number> = {
  SAND: 0.50,
  THOR: 2.25,
  ENRG: 0.12,
  MEME: 0.01,
  CAKE: 3.10,
};

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const url = env("SUPABASE_URL");
    const key = env("SUPABASE_SERVICE_ROLE_KEY");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const install_id = String((body as any).install_id ?? "").trim();
    const event = String((body as any).event ?? "").trim();

    if (!install_id || install_id.length < 8) {
      return NextResponse.json({ ok: false, error: "install_id required" }, { status: 400 });
    }
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, error: "invalid event" }, { status: 400 });
    }

    const rewardAmount = toNum((body as any).reward_amount);
    const priced = Boolean((body as any).priced);
    const tokenSymbol = (body as any).token_symbol ?? null;

    const priceUsd =
      priced && tokenSymbol && typeof tokenSymbol === "string"
        ? (MOCK_USD_PRICE[tokenSymbol.toUpperCase()] ?? null)
        : null;

    const valueUsd =
      priceUsd !== null && rewardAmount !== null ? rewardAmount * priceUsd : null;

    const payload = {
      install_id,
      event,
      box_id: (body as any).box_id ?? null,
      chain: (body as any).chain ?? null,
      token_symbol: tokenSymbol,
      usddd_cost: (body as any).usddd_cost ?? null,
      reward_amount: rewardAmount,
      priced,
      reward_price_usd: priceUsd,
      reward_value_usd: valueUsd,
    };

    const r = await fetch(`${url}/rest/v1/stats_events`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: "insert_failed", detail: txt.slice(0, 200) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}
