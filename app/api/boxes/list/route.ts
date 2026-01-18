import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(
  env("SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY")
);

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
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const ids = (data ?? []).map((x) => x.id);
  let acc: Record<string, any> = {};

  if (ids.length) {
    const { data: rows } = await supabase
      .from("dd_box_accounting")
      .select("box_id,deposited_total,withdrawn_total,claimed_unwithdrawn")
      .in("box_id", ids);

    (rows ?? []).forEach((r: any) => {
      acc[r.box_id] = r;
    });
  }

  const campaigns = (data ?? []).map((b: any) => {
    const a = acc[b.id] ?? {
      deposited_total: 0,
      withdrawn_total: 0,
      claimed_unwithdrawn: 0,
    };

    return {
      id: b.id,
      ownerUsername: b.owner_username,
      deployChainId: b.deploy_chain_id,
      deployFeeNativeSymbol: b.deploy_fee_native_symbol,
      deployFeeNativeAmount: Number(b.deploy_fee_native_amount ?? 0),

      tokenAddress: b.token_address ?? undefined,
      tokenSymbol: b.token_symbol ?? undefined,
      tokenDecimals: b.token_decimals ?? undefined,
      tokenChainId: b.token_chain_id ?? undefined,

      onChainBalance:
        Number(a.deposited_total) -
        Number(a.withdrawn_total) -
        Number(a.claimed_unwithdrawn),
      claimedUnwithdrawn: Number(a.claimed_unwithdrawn),
      depositedTotal: Number(a.deposited_total),
      withdrawnTotal: Number(a.withdrawn_total),

      meta: b.meta ?? {},

      costUSDDD: Number(b.cost_usddd),
      cooldownHours: Number(b.cooldown_hours),

      rewardMode: b.reward_mode,
      fixedReward: Number(b.fixed_reward),
      randomMin: Number(b.random_min),
      randomMax: Number(b.random_max),

      maxDigsPerUser: b.max_digs_per_user,

      stage: b.stage,
      status: b.status,

      createdAt: new Date(b.created_at).getTime(),
    };
  });

  return NextResponse.json({ ok: true, campaigns });
}
