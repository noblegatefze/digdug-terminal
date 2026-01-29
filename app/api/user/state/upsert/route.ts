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

function toNum(v: any, dflt = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

/**
 * POST /api/user/state/upsert
 * Body:
 * {
 *   terminal_user_id: string (uuid),
 *   username?: string,
 *   usddd_allocated?: number,
 *   usddd_acquired?: number,
 *   fuel_used_delta?: number,   // add to fuel_used
 *   digs_delta?: number,        // add to digs
 *   finds_delta?: number        // add to finds
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    const terminal_user_id = String(body?.terminal_user_id ?? "").trim();
    if (!terminal_user_id || terminal_user_id.length < 8) {
      return NextResponse.json({ ok: false, error: "missing_terminal_user_id" }, { status: 400 });
    }

    const username = typeof body?.username === "string" ? body.username.trim() : null;

    const usddd_allocated = body?.usddd_allocated != null ? toNum(body.usddd_allocated) : null;
    const usddd_acquired = body?.usddd_acquired != null ? toNum(body.usddd_acquired) : null;

    const fuel_used_delta = toNum(body?.fuel_used_delta, 0);
    const digs_delta = Math.max(0, Math.floor(toNum(body?.digs_delta, 0)));
    const finds_delta = Math.max(0, Math.floor(toNum(body?.finds_delta, 0)));

    // read current row (tiny, keyed)
    const { data: cur, error: curErr } = await supabase
      .from("dd_user_state")
      .select("terminal_user_id, username, usddd_allocated, usddd_acquired, fuel_used, digs, finds")
      .eq("terminal_user_id", terminal_user_id)
      .maybeSingle();

    if (curErr) {
      return NextResponse.json({ ok: false, error: "read_failed", detail: curErr.message }, { status: 500 });
    }

    const next = {
      terminal_user_id,
      username: username ?? (cur as any)?.username ?? null,
      usddd_allocated: usddd_allocated ?? Number((cur as any)?.usddd_allocated ?? 0),
      usddd_acquired: usddd_acquired ?? Number((cur as any)?.usddd_acquired ?? 0),
      fuel_used: Number((cur as any)?.fuel_used ?? 0) + fuel_used_delta,
      digs: Number((cur as any)?.digs ?? 0) + digs_delta,
      finds: Number((cur as any)?.finds ?? 0) + finds_delta,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase.from("dd_user_state").upsert(next, {
      onConflict: "terminal_user_id",
    });

    if (upErr) {
      return NextResponse.json({ ok: false, error: "upsert_failed", detail: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "unexpected", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
