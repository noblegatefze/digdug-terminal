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
  if (!isAuthed(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const { data, error } = await supabase.rpc("rpc_admin_flags").single();
  if (error || !data) return NextResponse.json({ ok: false, error: "read_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, flags: data });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);

  const patch = {
    pause_all: Boolean(body?.pause_all),
    pause_reserve: Boolean(body?.pause_reserve),
    pause_stats_ingest: Boolean(body?.pause_stats_ingest),
    updated_at: new Date().toISOString(),
    updated_by: "admin",
  };

  const { error } = await supabase.from("dd_admin_flags").update(patch).eq("id", true);
  if (error) return NextResponse.json({ ok: false, error: "write_failed" }, { status: 500 });

  // return canonical flags (RPC) after write
  const { data, error: readErr } = await supabase.rpc("rpc_admin_flags").single();
  if (readErr || !data) return NextResponse.json({ ok: false, error: "read_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, flags: data });
}
