import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash, createCipheriv } from "crypto";
import { Wallet } from "ethers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

// AES-256-GCM encrypt using TERMINAL_KEY_ENC_SECRET (server-only)
function encryptPrivKeyHex(privKeyHex: string, secret: string): string {
  const key = createHash("sha256").update(secret, "utf8").digest(); // 32 bytes
  const iv = randomBytes(12); // GCM recommended 12 bytes
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(privKeyHex, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // pack as base64: iv.tag.ciphertext
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

type Body = { username?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const username = String(body.username ?? "").trim();
    if (!username) return NextResponse.json({ ok: false, error: "missing_username" }, { status: 400 });

    const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });

    // Maintenance gate (DB-authoritative; same pattern as Fund)
    const { data: flags, error: flagsErr } = await sb.rpc("rpc_admin_flags");
    if (flagsErr) return NextResponse.json({ ok: false, paused: true }, { status: 503 });
    const row: any = Array.isArray(flags) ? flags[0] : flags;
    if (row && (row.pause_all || row.pause_reserve)) {
      return NextResponse.json({ ok: false, paused: true }, { status: 503 });
    }

    // Resolve terminal user
    const { data: u, error: uErr } = await sb
      .from("dd_terminal_users")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (uErr) throw uErr;
    if (!u?.id) return NextResponse.json({ ok: false, error: "terminal_user_not_found" }, { status: 404 });

    // If already issued, return it
    const { data: existing, error: exErr } = await sb
      .from("dd_terminal_deposit_wallets")
      .select("deposit_address, chain, created_at")
      .eq("terminal_user_id", u.id)
      .maybeSingle();

    if (exErr) throw exErr;

    if (existing?.deposit_address) {
      return NextResponse.json({
        ok: true,
        wallet: {
          username: u.username,
          chain: existing.chain ?? "bsc",
          standard: "BEP-20",
          deposit_address: String(existing.deposit_address),
          created_at: existing.created_at,
          reused: true,
        },
      });
    }

    // Issue new dedicated EOA (Terminal-only) via ethers
    const wallet = Wallet.createRandom();
    const priv = wallet.privateKey; // 0x...
    const depositAddress = wallet.address.toLowerCase();

    const encSecret = env("TERMINAL_KEY_ENC_SECRET");
    const enc = encryptPrivKeyHex(priv, encSecret);

    // Insert wallet row
    const { error: wErr } = await sb.from("dd_terminal_deposit_wallets").insert({
      terminal_user_id: u.id,
      username: u.username,
      chain: "bsc",
      deposit_address: depositAddress,
    });
    if (wErr) throw wErr;

    // Insert encrypted key row (never returned)
    const { error: kErr } = await sb.from("dd_terminal_deposit_keys").insert({
      terminal_user_id: u.id,
      enc_privkey: enc,
    });
    if (kErr) throw kErr;

    return NextResponse.json({
      ok: true,
      wallet: {
        username: u.username,
        chain: "bsc",
        standard: "BEP-20",
        deposit_address: depositAddress,
        created_at: new Date().toISOString(),
        reused: false,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "issue_failed" }, { status: 400 });
  }
}
