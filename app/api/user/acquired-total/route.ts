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
 * POST /api/user/acquired-total
 * Body:
 * {
 *   username: string,
 *   acquiredTotal: number
 * }
 *
 * Pre-Genesis safe backfill:
 * - Monotonic only (never decreases)
 * - Uses GREATEST(existing, incoming)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as null | {
      username?: string;
      acquiredTotal?: any;
    };

    const usernameRaw = body?.username;
    if (!usernameRaw || typeof usernameRaw !== "string") {
      return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });
    }
    const username = normalizeUsername(usernameRaw);

    const incoming = toNum(body?.acquiredTotal);
    if (incoming === null) {
      return NextResponse.json({ ok: false, error: "invalid_acquired_total" }, { status: 400 });
    }
    if (incoming < 0) {
      return NextResponse.json({ ok: false, error: "negative_not_allowed" }, { status: 400 });
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

    // Ensure row exists (non-destructive)
    const { error: ensureErr } = await supabase
      .from("dd_user_state")
      .upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (ensureErr) {
      return NextResponse.json(
        { ok: false, error: "state_ensure_failed", detail: ensureErr.message },
        { status: 500 }
      );
    }

    // Read current
    const { data: state, error: readErr } = await supabase
      .from("dd_user_state")
      .select("acquired_total")
      .eq("user_id", userId)
      .single();

    if (readErr) {
      return NextResponse.json(
        { ok: false, error: "state_read_failed", detail: readErr.message },
        { status: 500 }
      );
    }

    const current = Number(state?.acquired_total ?? 0);
    const next = Math.max(current, incoming);

    // Write only if it increases
    if (next > current + 1e-12) {
      const { error: updErr } = await supabase
        .from("dd_user_state")
        .update({
          acquired_total: next,
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

    return NextResponse.json({ ok: true, user: { id: userId, username: user.username }, acquiredTotal: next });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
