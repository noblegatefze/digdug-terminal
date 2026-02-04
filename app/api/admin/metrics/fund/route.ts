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

  const { searchParams } = new URL(req.url);
  const limit = Math.max(10, Math.min(200, Number(searchParams.get("limit") ?? 50) || 50));

  try {
    // Global totals
    const { data: all, error: aErr } = await supabase
      .from("fund_positions")
      .select("status, funded_usdt, usddd_allocated, usddd_accrued_display, created_at, funded_at, swept_at, position_ref, issued_deposit_address, deposit_tx_hash, sweep_tx_hash, treasury_sweep_tx_hash, usddd_mint_tx_hash, usddd_transfer_tx_hash, usddd_burn_tx_hash, terminal_user_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (aErr) throw new Error(aErr.message);

    const rows = all ?? [];

    // Totals over *all* positions (not just the limited set)
    // We do a second lightweight select for sums to keep it truthful.
    const { data: sums, error: sErr } = await supabase
      .from("fund_positions")
      .select("status, funded_usdt, usddd_allocated, usddd_accrued_display");

    if (sErr) throw new Error(sErr.message);

    const sumRows = sums ?? [];
    const total_usdt = sumRows.reduce((a, r: any) => a + Number(r.funded_usdt ?? 0), 0);
    const total_usddd_allocated = sumRows.reduce((a, r: any) => a + Number(r.usddd_allocated ?? 0), 0);
    const total_usddd_accrued_display = sumRows.reduce((a, r: any) => a + Number(r.usddd_accrued_display ?? 0), 0);

    const active_positions = sumRows.filter((r: any) => String(r.status) !== "awaiting_funds").length;
    const awaiting_positions = sumRows.filter((r: any) => String(r.status) === "awaiting_funds").length;

    return NextResponse.json({
      ok: true,
      totals: {
        positions: sumRows.length,
        active_positions,
        awaiting_positions,
        total_usdt,
        total_usddd_allocated,
        total_usddd_accrued_display,
        total_usddd_alloc_plus_accrued: total_usddd_allocated + total_usddd_accrued_display,
      },
      latest: rows,
      note: `Latest list limited to ${limit}. Totals computed over all positions.`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "fund_failed" }, { status: 500 });
  }
}
