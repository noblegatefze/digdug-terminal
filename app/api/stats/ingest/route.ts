import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function resolveTerminalUserId(supabase: any, username?: string | null): Promise<string | null> {
  try {
    if (!username) return null;

    const { data, error } = await supabase
      .from("dd_terminal_users")
      .select("id")
      .eq("username", username)
      .limit(1)
      .single();

    if (error) return null;

    // data shape depends on Supabase typings; treat safely
    const id = (data as any)?.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

const ALLOWED_EVENTS = new Set([
  "session_start",
  "dig_attempt",
  "dig_success",
  "withdraw",
  "box_create",
  "box_activate",
]);

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Server-side admin flags (DB-controlled pause)
const adminSupabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

// Soft global throttle for dig_success (prevents utilization explosions)
const DIG_SUCCESS_CAP_PER_MIN = Number(process.env.DIG_SUCCESS_CAP_PER_MIN ?? "600"); // tune on Vercel
const DIG_SUCCESS_WINDOW_SEC = 60;

async function isStatsPaused(): Promise<boolean> {
  const { data } = await adminSupabase
    .from("dd_admin_flags")
    .select("pause_all, pause_stats_ingest")
    .eq("id", true)
    .single();

  return Boolean(data?.pause_all || data?.pause_stats_ingest);
}

async function digSuccessSaturated(): Promise<boolean> {
  if (!Number.isFinite(DIG_SUCCESS_CAP_PER_MIN) || DIG_SUCCESS_CAP_PER_MIN <= 0) return false;

  const sinceIso = new Date(Date.now() - DIG_SUCCESS_WINDOW_SEC * 1000).toISOString();

  const { count, error } = await adminSupabase
    .from("stats_events")
    .select("id", { count: "exact", head: true })
    .eq("event", "dig_success")
    .gte("created_at", sinceIso);

  // fail-open: don't break gameplay if counting fails
  if (error) return false;

  return (count ?? 0) >= DIG_SUCCESS_CAP_PER_MIN;
}

export async function POST(req: Request) {
  try {
    // DB pause (preferred)
    if (await isStatsPaused()) {
      return NextResponse.json({ ok: false, error: "stats_ingest_paused" }, { status: 503 });
    }

    // Hard kill-switch (optional backup)
    if (process.env.DIGDUG_PAUSE === "1") {
      return NextResponse.json({ ok: false, error: "protocol_paused" }, { status: 503 });
    }

    const url = env("SUPABASE_URL");
    const key = env("SUPABASE_SERVICE_ROLE_KEY");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const username =
      typeof (body as any)?.username === "string" ? String((body as any).username).trim() : null;

    const install_id = String((body as any).install_id ?? "").trim();
    const event = String((body as any).event ?? "").trim();

    if (!install_id || install_id.length < 8) {
      return NextResponse.json({ ok: false, error: "install_id required" }, { status: 400 });
    }
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, error: "invalid event" }, { status: 400 });
    }

    // Soft global throttle (return 200 to avoid client retry storms)
    if (event === "dig_success") {
      if (await digSuccessSaturated()) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    }

    // Create supabase client only after basic validation
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Prefer explicit terminal_user_id from client (no lookup), fallback to username resolution
    const terminal_user_id =
      (body as any).terminal_user_id
        ? String((body as any).terminal_user_id)
        : await resolveTerminalUserId(supabase, username);

    // TRUST FRONTEND SNAPSHOT (Phase Zero rule)
    const rewardAmount = toNum((body as any).reward_amount);
    const rewardPriceUsd = toNum((body as any).reward_price_usd);
    const rewardValueUsd = toNum((body as any).reward_value_usd);

    const payload = {
      install_id,
      terminal_user_id,
      event,
      box_id: (body as any).box_id ?? null,
      chain: (body as any).chain ?? null,
      token_symbol: (body as any).token_symbol ?? null,
      usddd_cost: toNum((body as any).usddd_cost),
      reward_amount: rewardAmount,
      priced: rewardValueUsd != null,
      reward_price_usd: rewardPriceUsd,
      reward_value_usd: rewardValueUsd,
    };

    const r = await fetch(`${url}/rest/v1/stats_events`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: "insert_failed", detail: txt.slice(0, 200) },
        { status: 500 }
      );
    }

    // Update persistent Fuel Used (treasury_usddd) atomically (best-effort, never blocks gameplay)
    try {
      if (event === "dig_success" && terminal_user_id) {
        const cost = toNum((body as any).usddd_cost) ?? 0;
        if (cost > 0) {
          const findsInc = rewardAmount && rewardAmount > 0 ? 1 : 0;

          await supabase.rpc("rpc_user_add_fuel", {
            p_user_id: terminal_user_id,
            p_delta: cost,
            p_digs_inc: 1,
            p_finds_inc: findsInc,
          });
        }

      }
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}
