import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function isAuthed(req: NextRequest) {
  return Boolean(req.cookies.get("dd_admin")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // 24h window
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Protocol actions & sessions via stats_events
    const [{ count: events24h }, { count: sessions24h }] = await Promise.all([
      supabase.from("stats_events").select("*", { count: "estimated", head: true }).gte("created_at", since),
      supabase.from("dd_sessions").select("*", { count: "estimated", head: true }).gte("created_at", since),
    ]);

    // USDDD spent (canonical) via spend ledger
    const { data: spentAgg, error: sErr } = await supabase
      .from("dd_usddd_spend_ledger")
      .select("usddd_amount")
      .gte("created_at", since);

    if (sErr) throw new Error(sErr.message);
    const usdddSpent = (spentAgg ?? []).reduce((a: number, r: any) => a + Number(r.usddd_amount ?? 0), 0);

    // Claims value (USD) is not computed here; keep it raw (we can add snapshot pricing later)
    const { count: claims24h } = await supabase
      .from("dd_treasure_claims")
      .select("*", { count: "estimated", head: true })
      .gte("created_at", since);

    // Fund totals (global)
    const { data: fundRows, error: fErr } = await supabase
      .from("fund_positions")
      .select("funded_usdt, status");

    if (fErr) throw new Error(fErr.message);

    const totalFunded = (fundRows ?? []).reduce((a: number, r: any) => a + Number(r.funded_usdt ?? 0), 0);
    const activePositions = (fundRows ?? []).filter((r: any) => r.status !== "awaiting_funds").length;
    const awaitingPositions = (fundRows ?? []).filter((r: any) => r.status === "awaiting_funds").length;

    return NextResponse.json({
      ok: true,
      window: { since },
      counts: {
        protocol_events_24h: events24h ?? 0,
        sessions_24h: sessions24h ?? 0,
        claims_24h: claims24h ?? 0,
      },
      money: {
        usddd_spent_24h: usdddSpent,
        fund_total_usdt: totalFunded,
      },
      fund: {
        active_positions: activePositions,
        awaiting_positions: awaitingPositions,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "overview_failed" }, { status: 500 });
  }
}
