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
    .select(`
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
    `)
    .eq("status", "ACTIVE")
    .eq("stage", "CONFIGURED")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const boxes = data ?? [];
  const ids = boxes.map((b: any) => String(b.id));

  // ✅ Canonical balances from DB aggregation
  const balMap: Record<string, any> = {};
  if (ids.length) {
    const { data: bals, error: berr } = await supabase.rpc("rpc_box_balances_from_ledger", { p_box_ids: ids });
    if (berr) {
      return NextResponse.json({ ok: false, error: berr.message }, { status: 500 });
    }
    for (const r of bals ?? []) balMap[String((r as any).box_id)] = r;
  }

  const campaigns = boxes.map((b: any) => {
    const a = balMap[b.id] ?? {
      deposited_total: 0,
      withdrawn_total: 0,
      claimed_unwithdrawn: 0,
      onchain_balance: 0,
    };

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

      onChainBalance: asNum(a.onchain_balance),
      claimedUnwithdrawn: asNum(a.claimed_unwithdrawn),
      depositedTotal: asNum(a.deposited_total),
      withdrawnTotal: asNum(a.withdrawn_total),

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

  return NextResponse.json({ ok: true, campaigns });
}
