import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function isAuthed(req: NextRequest) {
  return Boolean(req.cookies.get("dd_admin")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("dd_admin_flags")
    .select("*")
    .eq("id", true)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, flags: data });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const pause_all = Boolean(body?.pause_all);
  const pause_reserve = Boolean(body?.pause_reserve);
  const pause_stats_ingest = Boolean(body?.pause_stats_ingest);

  const updated_by = String(body?.updated_by ?? "admin").slice(0, 80);

  const { data, error } = await supabase
    .from("dd_admin_flags")
    .update({
      pause_all,
      pause_reserve,
      pause_stats_ingest,
      updated_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, flags: data });
}
