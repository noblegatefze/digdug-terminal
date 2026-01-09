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

    const payload = {
      install_id,
      event,
      box_id: (body as any).box_id ?? null,
      chain: (body as any).chain ?? null,
      token_symbol: (body as any).token_symbol ?? null,
      usddd_cost: (body as any).usddd_cost ?? null,
      reward_amount: (body as any).reward_amount ?? null,
      priced: (body as any).priced ?? null,
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
