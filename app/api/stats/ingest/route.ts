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

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  // EMERGENCY PAUSE: stop stats ingest writes (bot kill-switch)
  if (process.env.DIGDUG_PAUSE === "1") {
    return NextResponse.json(
      { ok: false, error: "Protocol temporarily paused." },
      { status: 503 }
    );
  }

  try {
    const url = env("SUPABASE_URL");
    const key = env("SUPABASE_SERVICE_ROLE_KEY");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const install_id = String(body.install_id ?? "").trim();
    const event = String(body.event ?? "").trim();

    if (!install_id || install_id.length < 8) {
      return NextResponse.json({ ok: false, error: "install_id required" }, { status: 400 });
    }
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, error: "invalid event" }, { status: 400 });
    }

    // TRUST FRONTEND SNAPSHOT (Phase Zero rule)
    const rewardAmount = toNum(body.reward_amount);
    const rewardPriceUsd = toNum(body.reward_price_usd);
    const rewardValueUsd = toNum(body.reward_value_usd);

    const payload = {
      install_id,
      event,
      box_id: body.box_id ?? null,
      chain: body.chain ?? null,
      token_symbol: body.token_symbol ?? null,
      usddd_cost: toNum(body.usddd_cost),
      reward_amount: rewardAmount,
      priced: rewardValueUsd != null,
      reward_price_usd: rewardPriceUsd,
      reward_value_usd: rewardValueUsd,
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
      return NextResponse.json(
        { ok: false, error: "insert_failed", detail: txt.slice(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server_error" },
      { status: 500 }
    );
  }
}
