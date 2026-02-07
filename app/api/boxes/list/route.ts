import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  /**
   * IMPORTANT:
   * Listing boxes must NEVER depend on balances.
   * Balances are optional in Phase Zero and may be unavailable or partially unavailable.
   * If the RPC fails, we still return all campaigns with balances=null/0 + a warning.
   */
  const balMap: Record<string, any> = {};
  let balancesWarning: string | null = null;

  if (ids.length) {
    const { data: bals, error: berr } = await supabase.rpc("rpc_box_balances_from_ledger", { p_box_ids: ids });

    if (berr) {
      // Do NOT fail the endpoint — just mark warning.
      balancesWarning = `balances_unavailable:${berr.message}`;
    } else {
      for (const r of (bals ?? []) as any[]) {
        balMap[String(r.box_id)] = r;
      }
    }
  }

  const campaigns = boxes.map((b: any) => {
    const a = balMap[b.id]; // may be undefined if RPC failed or didn’t return this box

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

      // balances are OPTIONAL; if missing, keep as null (truthful) not fabricated.
      onChainBalance: a ? asNum(a.onchain_balance) : null,
      claimedUnwithdrawn: a ? asNum(a.claimed_unwithdrawn) : null,
      depositedTotal: a ? asNum(a.deposited_total) : null,
      withdrawnTotal: a ? asNum(a.withdrawn_total) : null,

      meta: b.meta ?? {},

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
