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

  // optional: ?sinceHours=24
  const { searchParams } = new URL(req.url);
  const sinceHours = Math.max(1, Math.min(168, Number(searchParams.get("sinceHours") ?? 24) || 24));
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

  try {
    // Pull aggregates per box in one go (can be heavy if unbounded; we timebox)
    const [ledgerRes, claimsRes] = await Promise.all([
      supabase
        .from("dd_box_ledger")
        .select("box_id, entry_type, amount, created_at")
        .gte("created_at", since),
      supabase
        .from("dd_treasure_claims")
        .select("box_id, amount, created_at")
        .gte("created_at", since),
    ]);

    if (ledgerRes.error) throw new Error(ledgerRes.error.message);
    if (claimsRes.error) throw new Error(claimsRes.error.message);

    const byBox: Record<string, any> = {};

    for (const r of ledgerRes.data ?? []) {
      const b = String((r as any).box_id);
      byBox[b] ||= { box_id: b, fund_in: 0, reserved: 0, adjust: 0, claimed: 0 };
      const t = String((r as any).entry_type);
      const amt = Number((r as any).amount ?? 0);
      if (t === "fund_in") byBox[b].fund_in += amt;
      else if (t === "claim_reserve") byBox[b].reserved += amt;
      else if (t === "adjust") byBox[b].adjust += amt;
    }

    for (const c of claimsRes.data ?? []) {
      const b = String((c as any).box_id);
      byBox[b] ||= { box_id: b, fund_in: 0, reserved: 0, adjust: 0, claimed: 0 };
      byBox[b].claimed += Number((c as any).amount ?? 0);
    }

    const rows = Object.values(byBox).map((x: any) => ({
      ...x,
      inferred_balance: x.fund_in - x.reserved + x.adjust,
      claimed_minus_reserved: x.claimed - x.reserved,
    }));

    rows.sort((a: any, b: any) => Math.abs(b.claimed_minus_reserved) - Math.abs(a.claimed_minus_reserved));

    return NextResponse.json({
      ok: true,
      window: { sinceHours, since },
      top_mismatches: rows.slice(0, 20),
      note: "Timeboxed aggregation. For full ledger-grade, we’ll move this into a DB RPC later.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "boxes_failed" }, { status: 500 });
  }
}
