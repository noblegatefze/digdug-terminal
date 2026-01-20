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

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * POST /api/user/state
 * Body:
 * {
 *   username: string,
 *   fuel?: { allocated:number, acquired:number, treasury:number } // optional write-back
 * }
 *
 * Returns canonical USDDD state from DB (claimable=allocated, acquired, treasury).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as null | {
      username?: string;
      fuel?: { allocated?: any; acquired?: any; treasury?: any };
    };

    const usernameRaw = body?.username;
    if (!usernameRaw || typeof usernameRaw !== "string") {
      return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });
    }

    const username = normalizeUsername(usernameRaw);

    // 1) Resolve user_id from dd_terminal_users
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

    const userId = user.id as string;

    // 2) Ensure dd_user_state row exists WITHOUT overwriting balances.
    //    NOTE: We only upsert user_id + updated_at. We do NOT send balance fields here.
    const { error: ensureErr } = await supabase
      .from("dd_user_state")
      .upsert(
        {
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (ensureErr) {
      return NextResponse.json(
        { ok: false, error: "state_ensure_failed", detail: ensureErr.message },
        { status: 500 }
      );
    }

    // 3) Optional write-back (v0.1.16.6): accept client fuel and persist it
    if (body?.fuel) {
      const allocated = toNum(body.fuel.allocated);
      let acquired = toNum(body.fuel.acquired);
      const treasury = toNum(body.fuel.treasury);

      if (acquired !== null) {
        // Pre-Genesis acquired cap
        const ACQUIRE_CAP = 1000;
        acquired = Math.min(acquired, ACQUIRE_CAP);
      }

      if (allocated === null || acquired === null || treasury === null) {
        return NextResponse.json({ ok: false, error: "invalid_fuel_numbers" }, { status: 400 });
      }
      if (allocated < 0 || acquired < 0 || treasury < 0) {
        return NextResponse.json({ ok: false, error: "negative_fuel_not_allowed" }, { status: 400 });
      }

      const { error: updErr } = await supabase
        .from("dd_user_state")
        .update({
          usddd_allocated: allocated,
          usddd_acquired: acquired,
          treasury_usddd: treasury,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updErr) {
        return NextResponse.json(
          { ok: false, error: "state_update_failed", detail: updErr.message },
          { status: 500 }
        );
      }
    }

    // 4) Read canonical state
    const { data: state, error: stateErr } = await supabase
      .from("dd_user_state")
      .select("user_id, usddd_allocated, usddd_acquired, treasury_usddd, acquired_total, updated_at")
      .eq("user_id", userId)
      .single();

    if (stateErr) {
      return NextResponse.json(
        { ok: false, error: "state_read_failed", detail: stateErr.message },
        { status: 500 }
      );
    }

    const allocated = Number(state.usddd_allocated ?? 0);
    const acquired = Number(state.usddd_acquired ?? 0);
    const treasury = Number(state.treasury_usddd ?? 0);

    return NextResponse.json({
      ok: true,
      user: { id: userId, username: user.username },
      usddd: { allocated, acquired, treasury, total: allocated + acquired },
      updatedAt: state.updated_at,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
