import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

function normalizeUsername(u: string) {
  return u.trim().toLowerCase();
}

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Pre-Genesis cap (locked for now)
const ACQUIRE_CAP = 1000;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as null | {
      username?: string;
      amount?: any;
    };

    const usernameRaw = body?.username;
    if (!usernameRaw || typeof usernameRaw !== "string") {
      return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });
    }
    const username = normalizeUsername(usernameRaw);

    const amt = toNum(body?.amount, NaN);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
    }

    // Resolve user_id
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

    // Ensure state row exists (non-destructive)
    const { error: ensureErr } = await supabase
      .from("dd_user_state")
      .upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (ensureErr) {
      return NextResponse.json(
        { ok: false, error: "state_ensure_failed", detail: ensureErr.message },
        { status: 500 }
      );
    }

    // Read current canonical state
    const { data: state, error: readErr } = await supabase
      .from("dd_user_state")
      .select("usddd_allocated, usddd_acquired, treasury_usddd, acquired_total")
      .eq("user_id", userId)
      .single();

    if (readErr) {
      return NextResponse.json(
        { ok: false, error: "state_read_failed", detail: readErr.message },
        { status: 500 }
      );
    }

    const allocated = toNum(state.usddd_allocated, 0);
    const acquiredBal = toNum(state.usddd_acquired, 0);
    const treasury = toNum(state.treasury_usddd, 0);
    const acquiredTotal = toNum(state.acquired_total, 0);

    // Cap applies to lifetime acquired_total
    const remaining = Math.max(0, ACQUIRE_CAP - acquiredTotal);
    if (remaining <= 0) {
      return NextResponse.json({
        ok: true,
        applied: false,
        reason: "cap_reached",
        cap: ACQUIRE_CAP,
        usddd: { allocated, acquired: acquiredBal, treasury, total: allocated + acquiredBal, acquiredTotal },
      });
    }

    const credit = Math.min(amt, remaining);
    const nextTotal = acquiredTotal + credit;
    const nextBal = acquiredBal + credit;

    const { error: updErr } = await supabase
      .from("dd_user_state")
      .update({
        usddd_acquired: nextBal,
        acquired_total: nextTotal,
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
      requested: amt,
      credit,
      cap: ACQUIRE_CAP,
      usddd: {
        allocated,
        acquired: nextBal,
        treasury,
        total: allocated + nextBal,
        acquiredTotal: nextTotal,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
