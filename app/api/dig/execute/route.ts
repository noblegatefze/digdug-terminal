import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function asNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function uid(prefix = "dig") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// Deterministic-ish server RNG (simple v0.3.0.0); can upgrade later
function rand01() {
  return Math.random();
}

function computeRewardFromBox(box: any): number {
  const mode = String(box?.reward_mode ?? "RANDOM").toUpperCase();
  const fixed = Number(box?.fixed_reward ?? 0);
  const rmin = Number(box?.random_min ?? 0);
  const rmax = Number(box?.random_max ?? 0);

  if (mode === "FIXED") {
    return Math.max(0, fixed);
  }

  // RANDOM
  const lo = Number.isFinite(rmin) ? rmin : 0;
  const hi = Number.isFinite(rmax) ? rmax : 0;
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  const v = a + (b - a) * rand01();
  return Math.max(0, v);
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.DIGDUG_PAUSE === "1") {
      return NextResponse.json({ ok: false, error: "protocol_paused" }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const username = String(body?.username ?? "").trim();
    const box_id = String(body?.box_id ?? "").trim();

    if (!username || !box_id) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // 1) Resolve terminal user
    const { data: user, error: uerr } = await sb
      .from("dd_terminal_users")
      .select("id, username")
      .eq("username", username)
      .single();

    if (uerr || !user) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    // 2) Load box (authoritative config)
    const { data: box, error: berr } = await sb
      .from("dd_boxes")
      .select(
        "id, deploy_chain_id, token_address, token_symbol, cost_usddd, reward_mode, fixed_reward, random_min, random_max, status, stage"
      )
      .eq("id", box_id)
      .single();

    if (berr || !box) {
      return NextResponse.json({ ok: false, error: "box_not_found" }, { status: 404 });
    }

    if (String(box.status) !== "ACTIVE" || String(box.stage) !== "CONFIGURED") {
      return NextResponse.json({ ok: false, error: "box_not_active" }, { status: 400 });
    }

    const cost = Number(box.cost_usddd ?? 0);
    if (!Number.isFinite(cost) || cost <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_cost" }, { status: 500 });
    }

    // 3) Compute reward server-side
    const reward_amount = computeRewardFromBox(box);
    const chain_id = String(box.deploy_chain_id ?? "").trim();
    const token_address = String(box.token_address ?? "").trim();
    const token_symbol = String(box.token_symbol ?? "").trim();

    if (!chain_id || !token_address || !token_symbol) {
      return NextResponse.json({ ok: false, error: "box_not_configured" }, { status: 400 });
    }

    // 4) Create dig_id server-side
    const dig_id = uid("dig");

    // 5) Reserve (canonical debit + reserve) FIRST
    // Reuse existing reserve API semantics via RPC directly here (best).
    const { data: rdata, error: rerr } = await sb.rpc("rpc_dig_reserve", {
      p_username: username,
      p_box_id: box_id,
      p_dig_id: dig_id,
      p_amount: reward_amount,
      p_cmc_id: null,
      p_price_usd_at_dig: null,
      p_price_at: new Date().toISOString(),
    });

    if (rerr) {
      return NextResponse.json({ ok: false, error: "reserve_failed", detail: rerr.message }, { status: 500 });
    }
    const out: any = rdata;
    if (!out?.ok) {
      return NextResponse.json(out ?? { ok: false, error: "reserve_failed" }, { status: 400 });
    }

    // 6) Insert claim after reserve (use same rules as /api/claims/add but inline)
    const { error: cerr } = await sb.from("dd_treasure_claims").insert({
      user_id: user.id,
      username: user.username,
      box_id,
      dig_id,
      chain_id,
      token_address,
      token_symbol,
      amount: reward_amount,
      status: "CLAIMED",
    });

    if (cerr) {
      const code = (cerr as any)?.code;
      // If duplicate (shouldn't happen with server dig_id), treat as ok
      if (code !== "23505") {
        return NextResponse.json({ ok: false, error: "claim_insert_failed", detail: cerr.message }, { status: 500 });
      }
    }

    // 7) Return canonical result + any balance fields rpc returned
    return NextResponse.json({
      ok: true,
      dig_id,
      box_id,
      username,
      cost_usddd: cost,
      chain_id,
      token_address,
      token_symbol,
      reward_amount,
      reserve: out,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}
