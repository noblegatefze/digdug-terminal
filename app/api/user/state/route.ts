import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function normalizeUsername(u: string) {
  return u.trim().toLowerCase();
}

/**
 * POST /api/user/state
 * Body: { username: string }
 *
 * Returns:
 * - admin flags
 * - terminal user id
 * - persistent user state from dd_user_state (if present, else zeros)
 *
 * NOTE: This is READ-ONLY. No writes here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as null | { username?: string };

    const usernameRaw = body?.username;
    if (!usernameRaw || typeof usernameRaw !== "string") {
      return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });
    }

    const username = normalizeUsername(usernameRaw);

    // 0) Read admin flags (authoritative maintenance gates)
    const { data: flagsRow, error: flagsErr } = await supabase.rpc("rpc_admin_flags").single();
    if (flagsErr) {
      return NextResponse.json(
        { ok: false, error: "flags_read_failed", detail: flagsErr.message },
        { status: 500 }
      );
    }

    const flags = {
      pause_all: Boolean((flagsRow as any)?.pause_all),
      pause_reserve: Boolean((flagsRow as any)?.pause_reserve),
      pause_stats_ingest: Boolean((flagsRow as any)?.pause_stats_ingest),
    };

    // 1) Resolve terminal_user_id from dd_terminal_users
    const { data: user, error: userErr } = await supabase
      .from("dd_terminal_users")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (userErr) {
      return NextResponse.json(
        { ok: false, error: "user_lookup_failed", detail: userErr.message },
        { status: 500 }
      );
    }
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    const terminal_user_id = String(user.id);

    // 2) Read persistent state (actual dd_user_state schema)
    const { data: state, error: stateErr } = await supabase
      .from("dd_user_state")
      .select(
        "user_id, username, usddd_allocated, usddd_acquired, treasury_usddd, acquired_total, digs_count, finds_count, updated_at"
      )
      .eq("user_id", terminal_user_id)
      .maybeSingle();

    if (stateErr) {
      return NextResponse.json(
        { ok: false, error: "state_read_failed", detail: stateErr.message },
        { status: 500 }
      );
    }

    const allocated = Number((state as any)?.usddd_allocated ?? 0);
    const acquired = Number((state as any)?.usddd_acquired ?? 0);
    const fuelUsed = Number((state as any)?.treasury_usddd ?? 0);
    const acquiredTotal = Number((state as any)?.acquired_total ?? 0);
    const updatedAt = (state as any)?.updated_at ?? null;
    const digs = Number((state as any)?.digs_count ?? 0);
    const finds = Number((state as any)?.finds_count ?? 0);

    // Keep response shape compatible with current Terminal expectations:
    // - "treasury" will now mean Fuel Used (we will rename label in UI next step)
    return NextResponse.json({
      ok: true,
      flags,
      user: { id: terminal_user_id, username: user.username },
      usddd: {
        allocated,
        acquired,
        treasury: fuelUsed,
        total: allocated + acquired,
        acquiredTotal,
      },

      counters: {
        digs,
        finds,
      },

      updatedAt,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
