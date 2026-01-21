import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SUPABASE_URL = reqEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = reqEnv("SUPABASE_SERVICE_ROLE_KEY");

type Body = {
  session_id?: string;
  install_id?: string | null;
  user_id?: string | null;
  username?: string | null;
  source?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const session_id = String(body.session_id ?? "").trim();
    if (!session_id) {
      return NextResponse.json({ ok: false, error: "missing session_id" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // idempotent: session_id is PRIMARY KEY
    const { error } = await supabase.from("dd_sessions").insert({
      session_id,
      install_id: body.install_id ?? null,
      user_id: body.user_id ?? null,
      username: body.username ?? null,
      source: body.source ?? "terminal",
    });

    // if duplicate, ignore (someone refreshed quickly / retry)
    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 }
    );
  }
}
