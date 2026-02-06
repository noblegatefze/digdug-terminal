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
  // 1) Load only ACTIVE + CONFIGURED boxes (what Terminal should show)
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
  const ids = boxes.map((x: any) => x.id);

  // 2) Compute balances from canonical ledger
  // Balance rule:
  //  + credit/deposit/fund/topup
  //  - claim/claim_paid/withdraw/debit/reserve
  let bal: Record<string, number> = {};
  let metaAgg: Record<string, { deposited: number; withdrawn: number; claimed_unwithdrawn: number }> = {};

  if (ids.length) {
    const { data: rows, error: lerr } = await supabase
      .from("dd_box_ledger")
      .select("box_id, entry_type, amount")
      .in("box_id", ids);

    if (lerr) {
      return NextResponse.json({ ok: false, error: lerr.message }, { status: 500 });
    }

    for (const r of rows ?? []) {
      const boxId = String((r as any).box_id);
      const entry = String((r as any).entry_type ?? "").toLowerCase();
      const amt = asNum((r as any).amount);

      if (!bal[boxId]) bal[boxId] = 0;
      if (!metaAgg[boxId]) metaAgg[boxId] = { deposited: 0, withdrawn: 0, claimed_unwithdrawn: 0 };

      // Credits
      if (entry === "credit" || entry === "deposit" || entry === "fund" || entry === "topup") {
        bal[boxId] += amt;
        metaAgg[boxId].deposited += amt; // display-only
        continue;
      }

      // Debits (box outflow / reserve)
      if (entry === "withdraw" || entry === "claim_paid" || entry === "debit" || entry === "reserve" || entry === "claim") {
        bal[boxId] -= amt;

        if (entry === "withdraw" || entry === "claim_paid") metaAgg[boxId].withdrawn += amt; // display-only
        if (entry === "claim" || entry === "reserve" || entry === "debit") metaAgg[boxId].claimed_unwithdrawn += amt; // display-only

        continue;
      }

      // Unknown entry types are ignored safely
    }
  }

  const campaigns = boxes.map((b: any) => {
    const onChainBalance = asNum(bal[b.id] ?? 0);
    const agg = metaAgg[b.id] ?? { deposited: 0, withdrawn: 0, claimed_unwithdrawn: 0 };

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

      // Canonical available for Terminal listing
      onChainBalance,

      // Display-only (kept for backward compat with UI expectations)
      claimedUnwithdrawn: asNum(agg.claimed_unwithdrawn),
      depositedTotal: asNum(agg.deposited),
      withdrawnTotal: asNum(agg.withdrawn),

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
