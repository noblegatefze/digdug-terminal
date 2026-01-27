import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function supa() {
  // match existing pattern in terminal repo (URL + service role)
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const db = supa();

    // IMPORTANT: keep this aligned with your admin flags storage
    // We read the most recent row from dd_admin_flags
    const { data, error } = await db
      .from("dd_admin_flags")
      .select("pause_all, pause_reserve, pause_stats_ingest, updated_at, updated_by")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const flags = data ?? {
      pause_all: false,
      pause_reserve: false,
      pause_stats_ingest: false,
      updated_at: null,
      updated_by: null,
    };

    const res = NextResponse.json({ ok: true, flags });
    // tiny cache to reduce load; Scan/Fund will also cache client-side
    res.headers.set("Cache-Control", "public, max-age=5, s-maxage=5");
    return res;
  } catch (e: any) {
    // Fail CLOSED: if we cannot read flags, default to pause_all=true (safer)
    const res = NextResponse.json(
      { ok: false, flags: { pause_all: true, pause_reserve: true, pause_stats_ingest: true }, error: String(e?.message ?? e) },
      { status: 200 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
