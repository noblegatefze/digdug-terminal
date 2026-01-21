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

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// keep consistent with client constants
const DAILY_ALLOCATION = 5;
const BASE_CAP = 20;
const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/user/allocate
 * Body: { username: string }
 *
 * DB-authoritative daily claim:
 * - Global 24h gating via dd_user_state.alloc_last_at
 * - Cap BASE_CAP on usddd_allocated (allocated only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as null | { username?: string };
    const usernameRaw = body?.username;

    if (!usernameRaw || typeof usernameRaw !== "string") {
      return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });
    }

    const username = normalizeUsername(usernameRaw);

    // resolve user
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

    // ensure state row exists (non-destructive)
    const { error: ensureErr } = await supabase
      .from("dd_user_state")
      .upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (ensureErr) {
      return NextResponse.json(
        { ok: false, error: "state_ensure_failed", detail: ensureErr.message },
        { status: 500 }
      );
    }

    // lock row by reading then updating (good enough under PostgREST + update with predicate)
    const { data: state, error: readErr } = await supabase
      .from("dd_user_state")
      .select("usddd_allocated, usddd_acquired, treasury_usddd, alloc_last_at")
      .eq("user_id", userId)
      .single();

    if (readErr) {
      return NextResponse.json(
        { ok: false, error: "state_read_failed", detail: readErr.message },
        { status: 500 }
      );
    }

    const now = Date.now();
    const lastAt = state.alloc_last_at ? new Date(state.alloc_last_at as any).getTime() : null;

    const ready = !lastAt || now - lastAt >= WINDOW_MS;
    if (!ready) {
      const remainingMs = Math.max(0, WINDOW_MS - (now - (lastAt ?? now)));
      return NextResponse.json({
        ok: true,
        applied: false,
        reason: "not_ready",
        remaining_ms: remainingMs,
        next_allowed_at: state.alloc_last_at,
      });
    }

    const allocated = toNum(state.usddd_allocated, 0);
    const acquired = toNum(state.usddd_acquired, 0);
    const treasury = toNum(state.treasury_usddd, 0);

    if (allocated >= BASE_CAP - 1e-9) {
      return NextResponse.json({
        ok: true,
        applied: false,
        reason: "cap_reached",
        cap: BASE_CAP,
        usddd: { allocated, acquired, treasury, total: allocated + acquired },
      });
    }

    const credit = Math.min(DAILY_ALLOCATION, Math.max(0, BASE_CAP - allocated));
    const nextAllocated = allocated + credit;

    const { error: updErr } = await supabase
      .from("dd_user_state")
      .update({
        usddd_allocated: nextAllocated,
        alloc_last_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updErr) {
      return NextResponse.json(
        { ok: false, error: "state_update_failed", detail: updErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      applied: true,
      credit,
      cap: BASE_CAP,
      usddd: { allocated: nextAllocated, acquired, treasury, total: nextAllocated + acquired },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
