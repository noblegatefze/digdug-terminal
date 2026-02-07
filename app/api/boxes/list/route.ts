import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function asNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function poolModeFromMeta(meta: any): "MOCK" | "LEDGER" {
  const m = meta ?? {};
  const v = String(m.pool_mode ?? "").toUpperCase();
  return v === "LEDGER" ? "LEDGER" : "MOCK"; // default MOCK
}

function clamp0(n: number) {
  return n < 0 ? 0 : n;
}

export async function GET() {
  const { data, error } = await supabase
    .from("dd_boxes")
    .select(
      `
      id,
      owner_username,
      deploy_chain_id,
      deploy_fee_native_symbol,
      deploy_fee_native_amount,
      token_address,
      token_symbol,
      token_decimals,
      token_chain_id,
      meta,
      cost_usddd,
      cooldown_hours,
      reward_mode,
      fixed_reward,
      random_min,
      random_max,
      max_digs_per_user,
      stage,
      status,
      created_at
    `
    )
    .eq("status", "ACTIVE")
    .eq("stage", "CONFIGURED")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const boxes = data ?? [];
  const ids = boxes.map((b: any) => String(b.id));

  // Optional ledger balances (do NOT block listing)
  const balMap: Record<string, any> = {};
  let balancesWarning: string | null = null;

  if (ids.length) {
    const { data: bals, error: berr } = await supabase.rpc("rpc_box_balances_from_ledger", { p_box_ids: ids });
    if (berr) {
      balancesWarning = `balances_unavailable:${berr.message}`;
    } else {
      for (const r of (bals ?? []) as any[]) balMap[String(r.box_id)] = r;
    }
  }

  const campaigns = boxes.map((b: any) => {
    const meta = b.meta ?? {};
    const poolMode = poolModeFromMeta(meta);

    // Pull ledger-shaped totals if present
    const a = balMap[b.id];

    const depositedTotal = a ? asNum(a.deposited_total) : 0;
    const withdrawnTotal = a ? asNum(a.withdrawn_total) : 0;
    const claimedUnwithdrawn = a ? asNum(a.claimed_unwithdrawn) : 0;
    const onChainBalance = a ? asNum(a.onchain_balance) : 0;

    // Canonical availability shape (never negative)
    // In MOCK mode, this will behave the same way once you start writing mock credits.
    const available = clamp0(depositedTotal - claimedUnwithdrawn - withdrawnTotal);

    // Computed status for UI. Never let the terminal infer this from missing fields.
    const statusComputed = available > 0 ? "READY" : "EMPTY";

    // Warnings (debug-friendly, no storms)
    const warnings: string[] = [];
    if (!a) warnings.push("NO_LEDGER_TOTALS");
    if (depositedTotal === 0) warnings.push("NO_CREDITS");
    if (available === 0) warnings.push("EMPTY");

    return {
      id: b.id,
      ownerUsername: b.owner_username,
      deployChainId: b.deploy_chain_id,
      deployFeeNativeSymbol: b.deploy_fee_native_symbol,
      deployFeeNativeAmount: asNum(b.deploy_fee_native_amount),

      tokenAddress: b.token_address ?? undefined,
      tokenSymbol: b.token_symbol ?? undefined,
      tokenDecimals: b.token_decimals ?? undefined,
      tokenChainId: b.token_chain_id ?? undefined,

      // ledger-shaped totals (always present, numeric)
      depositedTotal,
      withdrawnTotal,
      claimedUnwithdrawn,
      onChainBalance,

      // computed
      available,
      statusComputed,
      poolMode,
      warnings,

      meta,

      costUSDDD: asNum(b.cost_usddd),
      cooldownHours: asNum(b.cooldown_hours),

      rewardMode: b.reward_mode,
      fixedReward: asNum(b.fixed_reward),
      randomMin: asNum(b.random_min),
      randomMax: asNum(b.random_max),

      maxDigsPerUser: b.max_digs_per_user,

      stage: b.stage,
      status: b.status,

      createdAt: new Date(b.created_at).getTime(),
    };
  });

  return NextResponse.json({
    ok: true,
    campaigns,
    warning: balancesWarning,
    counts: {
      active_configured: campaigns.length,
      balances_returned: Object.keys(balMap).length,
    },
  });
}
