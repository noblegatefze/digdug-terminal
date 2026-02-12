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

    const install_id = body.install_id ? String(body.install_id).trim() : "";
    const username = body.username ? String(body.username).trim() : "";
    const source = body.source ? String(body.source).trim() : "terminal";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Resolve user_id from username if not provided
    let resolvedUserId: string | null = body.user_id ? String(body.user_id).trim() : null;

    if (!resolvedUserId && username) {
      const { data: tu, error: tuErr } = await supabase
        .from("dd_terminal_users")
        .select("id")
        .eq("username", username)
        .limit(1)
        .single();

      if (!tuErr && tu?.id) resolvedUserId = String(tu.id);
      // If terminal user not found, we still log session with username only (non-blocking)
    }

    // Always log the current session row (idempotent)
    const { error: upsertErr } = await supabase
      .from("dd_sessions")
      .upsert(
        {
          session_id,
          install_id: install_id || null,
          user_id: resolvedUserId ?? null,
          username: username || null,
          source,
        },
        { onConflict: "session_id" }
      );

    if (upsertErr) {
      return NextResponse.json({ ok: false, error: upsertErr.message }, { status: 500 });
    }

    // ✅ Ledger-grade: if identity is known, attach it to the latest install-only session row
    // This fixes the common case: first load logged as anonymous, later load resolves username/user_id.
    if (install_id && resolvedUserId && username) {
      const { error: rpcErr } = await supabase.rpc("rpc_session_attach_user", {
        p_install_id: install_id,     // TEXT in DB
        p_user_id: resolvedUserId,    // UUID
        p_username: username,
      });

      // Non-blocking: we don't fail session logging if attach fails.
      // But we return the error for visibility (optional).
      if (rpcErr) {
        return NextResponse.json({
          ok: true,
          user_id: resolvedUserId,
          attach_warning: rpcErr.message,
        });
      }
    }

    return NextResponse.json({ ok: true, user_id: resolvedUserId ?? null });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 }
    );
  }
}
