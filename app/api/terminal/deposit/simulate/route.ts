import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

type Body = { username?: string };

function randAmount(min = 25, max = 250) {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 100) / 100; // 2dp
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const username = String(body.username ?? "").trim();
    if (!username) return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });

    const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });

    // Maintenance gate
    const { data: flags, error: flagsErr } = await sb.rpc("rpc_admin_flags");
    if (flagsErr) return NextResponse.json({ ok: false, paused: true }, { status: 503 });
    const row: any = Array.isArray(flags) ? flags[0] : flags;
    if (row && (row.pause_all || row.pause_reserve)) {
      return NextResponse.json({ ok: false, paused: true }, { status: 503 });
    }

    // must already have deposit wallet (user should run acquire first)
    const { data: w, error: wErr } = await sb
      .from("dd_terminal_deposit_wallets")
      .select("deposit_address")
      .eq("username", username)
      .maybeSingle();

    if (wErr) throw wErr;
    if (!w?.deposit_address) {
      return NextResponse.json({ ok: false, error: "deposit_wallet_missing" }, { status: 400 });
    }

    // ------------------------------------------------------------
    // Dynamic acquire cap (mock): 1000 + 1000 per 500 FINDS (claims)
    // - computed from dd_treasure_claims.user_id (successful digs)
    // - safe fallback to 1000 if anything fails
    // ------------------------------------------------------------
    let cap_usddd = 1000;

    try {
      const { data: u, error: uErr } = await sb
        .from("dd_terminal_users")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (!uErr && u?.id) {
        const { data: cap, error: capErr } = await sb.rpc("rpc_user_acquire_cap", {
          p_user_id: u.id,
        });

        // Supabase RPC scalar returns can vary depending on client/version;
        // handle number directly or wrapped shapes.
        const capNum =
          typeof cap === "number"
            ? cap
            : (cap as any)?.cap_usddd ??
              (cap as any)?.rpc_user_acquire_cap ??
              (Array.isArray(cap) ? (cap as any[])[0] : null);

        if (!capErr && Number.isFinite(Number(capNum))) {
          cap_usddd = Math.max(1000, Math.floor(Number(capNum)));
        }
      }
    } catch {
      // ignore; keep default
    }

    const usdt = randAmount(25, 250);
    const tx = `0x${randomBytes(32).toString("hex")}`;

    const { data, error } = await sb.rpc("rpc_terminal_apply_deposit", {
      p_username: username,
      p_usdt: usdt,
      p_tx_hash: tx,
      p_mode: "MOCK",
    });

    if (error) {
      const msg = String((error as any)?.message ?? "rpc_failed");
      return NextResponse.json({ ok: false, error: msg, cap_usddd }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      tx_hash: tx,
      cap_usddd,
      ...data,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "simulate_failed" }, { status: 400 });
  }
}
