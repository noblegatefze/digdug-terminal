import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function passHashOf(pass: string) {
  return crypto.createHash("sha256").update(String(pass)).digest("hex");
}

type Body = {
  username?: string;
  terminal_pass?: string;
  amount?: number;
  to_address?: string;
};

export async function POST(req: Request) {
  const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const body = (await req.json().catch(() => ({}))) as Body;

  const username = String(body.username ?? "").trim();
  const terminal_pass = String(body.terminal_pass ?? "").trim();
  const to_address = String(body.to_address ?? "").trim();
  const amount = Number(body.amount ?? 0);

  if (!username) return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });
  if (!terminal_pass) return NextResponse.json({ ok: false, error: "missing_terminal_pass" }, { status: 400 });
  if (!to_address) return NextResponse.json({ ok: false, error: "missing_to_address" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });

  // Maintenance gate
  const { data: flags, error: flagsErr } = await sb.rpc("rpc_admin_flags");
  if (flagsErr) return NextResponse.json({ ok: false, paused: true }, { status: 503 });
  const row: any = Array.isArray(flags) ? flags[0] : flags;
  if (row && (row.pause_all || row.pause_reserve)) return NextResponse.json({ ok: false, paused: true }, { status: 503 });

  // Auth user
  const { data: u, error: uErr } = await sb
    .from("dd_terminal_users")
    .select("id, username, pass_hash")
    .eq("username", username)
    .maybeSingle();

  if (uErr) return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });
  if (!u?.id) return NextResponse.json({ ok: false, error: "terminal_user_not_found" }, { status: 404 });

  const h = passHashOf(terminal_pass);
  if (String(u.pass_hash) !== h) return NextResponse.json({ ok: false, error: "invalid_terminal_pass" }, { status: 401 });

  const tx = `0x${randomBytes(32).toString("hex")}`;

  const { data, error } = await sb.rpc("rpc_terminal_withdraw_usddd_acquired", {
    p_user_id: u.id,
    p_username: username,
    p_amount: amount,
    p_to_address: to_address,
    p_tx_hash: tx,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tx_hash: tx, ...data });
}
