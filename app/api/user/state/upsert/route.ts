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
 *   user_id: string (uuid),              // IMPORTANT: matches dd_user_state.user_id
 *   username?: string,
 *   usddd_allocated?: number,
 *   usddd_acquired?: number,
 *   treasury_delta?: number              // add to dd_user_state.treasury_usddd (Fuel Used)
 * }
 *
 * NOTE: We keep this table lightweight and compatible with existing Terminal reads.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;

    const user_id = String(body?.user_id ?? "").trim();
    if (!user_id || user_id.length < 8) {
      return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 400 });
    }

    const username = typeof body?.username === "string" ? body.username.trim() : null;

    const usddd_allocated = body?.usddd_allocated != null ? toNum(body.usddd_allocated) : null;
    const usddd_acquired = body?.usddd_acquired != null ? toNum(body.usddd_acquired) : null;

    const treasury_delta = toNum(body?.treasury_delta, 0);

    // read current row (tiny, keyed)
    const { data: cur, error: curErr } = await supabase
      .from("dd_user_state")
      .select("user_id, username, usddd_allocated, usddd_acquired, treasury_usddd, acquired_total")
      .eq("user_id", user_id)
      .maybeSingle();

    if (curErr) {
      return NextResponse.json({ ok: false, error: "read_failed", detail: curErr.message }, { status: 500 });
    }

    const next = {
      user_id,
      username: username ?? (cur as any)?.username ?? null,
      usddd_allocated: usddd_allocated ?? Number((cur as any)?.usddd_allocated ?? 0),
      usddd_acquired: usddd_acquired ?? Number((cur as any)?.usddd_acquired ?? 0),
      treasury_usddd: Number((cur as any)?.treasury_usddd ?? 0) + treasury_delta,
      acquired_total: Number((cur as any)?.acquired_total ?? 0), // keep as-is
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase.from("dd_user_state").upsert(next, {
      onConflict: "user_id",
    });

    if (upErr) {
      return NextResponse.json({ ok: false, error: "upsert_failed", detail: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "unexpected", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
