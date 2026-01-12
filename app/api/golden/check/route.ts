import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabaseAdmin = createClient(
  reqEnv("SUPABASE_URL"),
  reqEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://digdug.do";
const ADMIN_KEY = reqEnv("ADMIN_API_KEY");

// Golden Find rules
const GOLD_MIN = 5;
const GOLD_MAX = 20;
const DAILY_CAP = 5;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function genClaimCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "GF-";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function buildMessage(p: { token: string; chain: string; usd: number; claim: string }) {
  return [
    "GOLDEN FIND",
    "",
    "A tester just uncovered a GOLDEN FIND",
    `Token: ${p.token} (${p.chain})`,
    `Reward value: $${p.usd.toFixed(2)}`,
    "",
    "Sponsored by ToastPunk",
    "",
    `CLAIM: DM @DigsterBot and send: /claim ${p.claim}`,
    "Note: you must be verified (DM /verify, then type verify DG-XXXX in Terminal).",
    "",
    "Digging continues."
  ].join("\n");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const usdValue = Number(body.usd_value);
  const token = String(body.token ?? "").trim();
  const chain = String(body.chain ?? "").trim();
  const username = String(body.username ?? "").trim();

  if (!Number.isFinite(usdValue) || usdValue < GOLD_MIN || usdValue > GOLD_MAX) {
    return NextResponse.json({ ok: true, golden: false, reason: "out_of_range" });
  }

  if (!token || !chain) {
    return NextResponse.json({ ok: true, golden: false, reason: "missing_token_or_chain" });
  }

  const day = todayUTC();

  // 1) Atomically take a daily slot (prevents race conditions)
  type GoldenSlot = { allowed: boolean; new_count: number };

  const { data: slot, error: slotErr } = await supabaseAdmin
    .rpc("dd_take_golden_slot", { p_day: day, p_cap: DAILY_CAP })
    .single<GoldenSlot>();

  if (slotErr) {
    console.error("[golden] slot rpc failed:", slotErr);
    return NextResponse.json({ ok: false, error: "slot_rpc_failed" }, { status: 500 });
  }

  if (!slot?.allowed) {
    return NextResponse.json({ ok: true, golden: false, reason: "daily_cap_reached" });
  }

  // 2) Resolve terminal user (required to award real rewards)
  if (!username) {
    return NextResponse.json({ ok: true, golden: false, reason: "missing_username" });
  }

  const { data: users, error: uErr } = await supabaseAdmin
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .limit(1);

  if (uErr || !users?.[0]?.id) {
    return NextResponse.json({ ok: true, golden: false, reason: "terminal_user_not_found" });
  }

  const terminal_user_id = users[0].id as string;

  // Optional: attach tg_user_id if already linked
  const { data: linkRows } = await supabaseAdmin
    .from("dd_tg_verify_codes")
    .select("tg_user_id")
    .eq("terminal_user_id", terminal_user_id)
    .not("used_at", "is", null)
    .order("used_at", { ascending: false })
    .limit(1);

  const tg_user_id = (linkRows?.[0] as any)?.tg_user_id ?? null;

  // 3) Insert golden event with claim code
  let claim_code = genClaimCode();

  for (let i = 0; i < 4; i++) {
    const { error: insErr } = await supabaseAdmin.from("dd_tg_golden_events").insert({
      day,
      claim_code,
      terminal_user_id,
      terminal_username: username,
      tg_user_id,
      token,
      chain,
      usd_value: usdValue,
      broadcasted_at: new Date().toISOString()
    });

    if (!insErr) break;

    const msg = String((insErr as any)?.message ?? "").toLowerCase();
    if (msg.includes("duplicate")) {
      claim_code = genClaimCode();
      continue;
    }

    console.error("[golden] insert event failed:", insErr);
    return NextResponse.json({ ok: false, error: "golden_event_insert_failed" }, { status: 500 });
  }

  // 4) Broadcast (ASCII)
  const message = buildMessage({ token, chain, usd: usdValue, claim: claim_code });

  const br = await fetch(`${SITE}/api/admin/telegram/broadcast`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": ADMIN_KEY
    },
    body: JSON.stringify({
      mode: "send",
      message,
      includeTypes: ["supergroup"],
      maxSend: 1,
      delayMs: 400
    })
  });

  const out = await br.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    golden: true,
    claim_code,
    terminal_user_id,
    tg_user_id,
    broadcast: out
  });
}
