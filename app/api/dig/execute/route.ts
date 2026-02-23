import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function uid(prefix = "dig") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// Deterministic-ish server RNG (simple v0.3.0.0); can upgrade later
function rand01() {
  return Math.random();
}

const MIN_YIELD_FLOOR = 0.000001;

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

/**
 * Tier by USD (canonical for DB)
 * Bands (from your UI): <1, <4, <10, <25, else mega
 */
function findTierByUsd(realUsd: number) {
  if (!Number.isFinite(realUsd) || realUsd < 0) return "FIND";
  if (realUsd < 1) return "BASE FIND";
  if (realUsd < 4) return "LOW FIND";
  if (realUsd < 10) return "MEDIUM FIND";
  if (realUsd < 25) return "HIGH FIND";
  return "MEGA FIND";
}

/**
 * Get latest address-based USD price for (chain_id, token_address).
 * Returns null if not found.
 */
async function getLatestAddrPriceUsd(chain_id: string, token_address: string): Promise<number | null> {
  const { data, error } = await sb
    .from("dd_token_price_snapshots_addr")
    .select("price_usd, as_of")
    .eq("chain_id", chain_id)
    .eq("token_address", token_address)
    .order("as_of", { ascending: false })
    .limit(1);

  if (error) return null;
  const row = data?.[0];
  const price = row ? Number(row.price_usd) : NaN;
  return Number.isFinite(price) && price > 0 ? price : null;
}

function num(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

async function getBoxAvailableFromLedger(box_id: string): Promise<number | null> {
  // Canonical source used by /api/boxes/list
  const { data, error } = await sb.rpc("rpc_box_balances_from_ledger", {
    p_box_ids: [box_id],
  });

  if (error) return null;
  const rows = Array.isArray(data) ? (data as any[]) : [];
  const row = rows.find((r) => String(r?.box_id ?? "") === box_id) ?? rows[0];
  if (!row) return 0;

  const avail = Math.max(0, num(row?.onchain_balance));
  return avail;
}

/** ---------------------------------------
 * CAPTCHA PASS ENFORCEMENT (server-side)
 * --------------------------------------*/
async function requireCaptchaPassForDig(args: {
  username: string;
  install_id: string;
  captcha_pass_id: string;
}) {
  const { username, install_id, captcha_pass_id } = args;

  const { data: pass, error } = await sb
    .from("dd_captcha_passes")
    .select("*")
    .eq("id", captcha_pass_id)
    .single();

  if (error || !pass) return { ok: false as const, error: "captcha_pass_not_found" };

  if (String(pass.purpose) !== "DIG" || String(pass.username) !== username || String(pass.install_id) !== install_id) {
    return { ok: false as const, error: "captcha_pass_scope_mismatch" };
  }

  const exp = new Date(String(pass.expires_at)).getTime();
  if (!Number.isFinite(exp) || Date.now() > exp) return { ok: false as const, error: "captcha_pass_expired" };

  const left = Number(pass.digs_left ?? 0);
  if (!Number.isFinite(left) || left <= 0) return { ok: false as const, error: "captcha_pass_empty" };

  // decrement dig allowance
  const { error: e2 } = await sb
    .from("dd_captcha_passes")
    .update({ digs_left: left - 1 })
    .eq("id", captcha_pass_id);

  if (e2) return { ok: false as const, error: "captcha_pass_decrement_failed" };

  return { ok: true as const, digs_left: left - 1 };
}

function asText(v: any) {
  const s = String(v ?? "").trim();
  return s;
}

function isMissingInstallErr(msg: string) {
  const m = (msg ?? "").toLowerCase();
  return m.includes("missing_install_id");
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.DIGDUG_PAUSE === "1") {
      return NextResponse.json({ ok: false, error: "protocol_paused" }, { status: 503 });
    }

    const body = await req.json().catch(() => null);

    const username = asText(body?.username);
    const box_id = asText(body?.box_id);

    // ✅ Server-side captcha enforcement fields
    const install_id = asText(body?.install_id);
    const captcha_pass_id = asText(body?.captcha_pass_id);

    if (!username || !box_id) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // CAPTCHA required (server side)
    if (!install_id || !captcha_pass_id) {
      return NextResponse.json({ ok: false, error: "captcha_required" }, { status: 403 });
    }

    const gate = await requireCaptchaPassForDig({ username, install_id, captcha_pass_id });
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.error }, { status: 403 });
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

    const chain_id = String(box.deploy_chain_id ?? "").trim().toUpperCase();
    const token_address = String(box.token_address ?? "").trim();
    const token_symbol = String(box.token_symbol ?? "").trim().toUpperCase();

    if (!chain_id || !token_address || !token_symbol) {
      return NextResponse.json({ ok: false, error: "box_not_configured" }, { status: 400 });
    }

    // 3) Canonical inventory check (same truth as /api/boxes/list)
    const available = await getBoxAvailableFromLedger(box_id);
    if (available == null) {
      return NextResponse.json({ ok: false, error: "box_balance_lookup_failed" }, { status: 500 });
    }
    if (available < MIN_YIELD_FLOOR) {
      return NextResponse.json(
        { ok: false, error: "insufficient_box_balance", available, requested: MIN_YIELD_FLOOR },
        { status: 400 }
      );
    }

    // 4) Compute reward server-side and CLAMP to available
    const rawReward = computeRewardFromBox(box);
    const safeReward = Math.max(MIN_YIELD_FLOOR, Number.isFinite(rawReward) ? rawReward : 0);
    const reward_amount = Math.min(available, safeReward);

    if (!Number.isFinite(reward_amount) || reward_amount < MIN_YIELD_FLOOR) {
      return NextResponse.json(
        { ok: false, error: "insufficient_box_balance", available, requested: safeReward },
        { status: 400 }
      );
    }

    // 5) Create dig_id server-side
    const dig_id = uid("dig");

    // 6) Reserve (canonical debit + reserve) FIRST
    const { data: rdata, error: rerr } = await sb.rpc("rpc_dig_reserve", {
      p_username: username,
      p_box_id: box_id,
      p_dig_id: dig_id,
      p_amount: cost,
      p_cmc_id: null,
      p_price_usd_at_dig: null,
      p_price_at: new Date().toISOString(),

      // ✅ CRITICAL: pass install_id so DB triggers + RPC accept it
      p_install_id: install_id,
    });

    if (rerr) {
      // If DB enforces install_id and it is missing/mismatched, treat as 400
      if (isMissingInstallErr(rerr.message)) {
        return NextResponse.json({ ok: false, error: "missing_install_id" }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: "reserve_failed", detail: rerr.message }, { status: 500 });
    }

    const out: any = rdata;
    if (!out?.ok) {
      // Surface missing_install_id cleanly if it bubbles through as a normal response object
      if (String(out?.error ?? "") === "missing_install_id") {
        return NextResponse.json({ ok: false, error: "missing_install_id" }, { status: 400 });
      }
      return NextResponse.json(out ?? { ok: false, error: "reserve_failed" }, { status: 400 });
    }

    // 7) Compute USD + tier (best-effort; never blocks claim)
    let price_usd: number | null = null;
    let reward_usd: number | null = null;
    let find_tier: string = "FIND";

    try {
      price_usd = await getLatestAddrPriceUsd(chain_id, token_address);
      if (price_usd !== null) {
        reward_usd = reward_amount * price_usd;
        find_tier = findTierByUsd(reward_usd);
      }
    } catch {
      // Best effort only
    }

    let is_golden = false;
    let golden_claim_code: string | null = null;

    try {
      if (reward_usd !== null) {
        const dayUtc = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // Ensure today's Golden windows exist (idempotent)
        {
          const { error: wErr } = await sb.rpc("rpc_golden_ensure_today_windows", {
            p_cap: 5,
            p_window_minutes: 60,
          });
          if (wErr) console.error("[golden] ensure windows failed:", wErr.message);
        }

        const { data: gdata, error: gerr } = await sb.rpc("dd_golden_try_award", {
          p_day: dayUtc,
          p_now: new Date().toISOString(),
          p_terminal_user_id: user.id,
          p_terminal_username: user.username,
          p_tg_user_id: null, // you can wire this later if you map TG
          p_token: token_symbol,
          p_chain: chain_id,
          p_usd_value: reward_usd,
          p_dig_id: dig_id,
        });

        if (!gerr && Array.isArray(gdata) && gdata.length > 0) {
          const g = gdata[0];
          if (g?.golden === true) {
            is_golden = true;
            golden_claim_code = g.claim_code ?? null;
          }
        }
      }
    } catch {
      // Golden is best-effort only. Never break dig.
    }

    // 8) Insert claim after reserve (RETURN inserted row)
    const { data: claimRow, error: cerr } = await sb
      .from("dd_treasure_claims")
      .insert({
        user_id: user.id,
        username: user.username,
        box_id,
        dig_id,
        chain_id,
        token_address,
        token_symbol,
        amount: reward_amount,
        status: "CLAIMED",
        find_tier,
        is_golden,
      })
      .select("id")
      .single();

    if (cerr && (cerr as any)?.code !== "23505") {
      return NextResponse.json({ ok: false, error: "claim_insert_failed", detail: cerr.message }, { status: 500 });
    }

    // 9) Return canonical result + tier info
    return NextResponse.json({
      ok: true,
      dig_id,
      claim_id: claimRow?.id ?? null,
      box_id,
      username,
      cost_usddd: cost,
      chain_id,
      token_address,
      token_symbol,
      reward_amount,
      price_usd,
      reward_usd,
      is_golden,
      golden_claim_code,

      // ✅ backwards compatible aliases for older clients (Terminal golden gate)
      reward_price_usd: price_usd,
      reward_usd_value: reward_usd,

      find_tier,
      reserve: out,

      // helpful: tells client how many digs remain on this pass
      captcha_digs_left: (gate as any)?.digs_left ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}