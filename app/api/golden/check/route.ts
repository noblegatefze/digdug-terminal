import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabaseAdmin = createClient(reqEnv("SUPABASE_URL"), reqEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://digdug.do";

// Golden Find rules (LOCKED)
const GOLD_MIN = 5;
const GOLD_MAX = 20;
const DAILY_CAP = 5;

// Hard floor so it can’t rapid-fire even if lots of users dig
const MIN_GAP_FLOOR_SECONDS = 2 * 60 * 60; // 2 hours

const GAP_JITTER_MAX_SECONDS = 60 * 60; // +0–60 min unpredictability (server-side)

function todayUTCDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function genClaimCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "GF-";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function msUntilNextUtcReset(now = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const next = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
  return Math.max(0, next.getTime() - now.getTime());
}

function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const rem = total % 3600;
  const min = Math.floor(rem / 60);
  const sec = rem % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function buildMessage(p: {
  token: string;
  chain: string;
  usd: number;
  claim: string;
  slotNumber: number;
  slotCap: number;
  timeLeftHMS: string;
}) {
  return [
    "GOLDEN FIND",
    "",
    "A tester just uncovered a GOLDEN FIND",
    `Token: ${p.token} (${p.chain})`,
    `Reward value: $${p.usd.toFixed(2)}`,
    "",
    `Golden Find ${p.slotNumber}/${p.slotCap}`,
    `UTC reset in: ${p.timeLeftHMS}`,
    "",
    "Sponsored by ToastPunk",
    "",
    `CLAIM: DM @DigsterBot and send: /claim ${p.claim}`,
    "Note: you must be verified (DM /verify, then type verify DG-XXXX in Terminal).",
    "",
    "Digging continues.",
  ].join("\n");
}

function inferBroadcastSent(out: any): boolean {
  if (!out) return false;
  if (out.ok === false) return false;
  const sent = out?.counts?.sent;
  if (typeof sent === "number") return sent > 0;
  return false;
}

export async function POST(req: Request) {
  try {
    const ADMIN_KEY = process.env.ADMIN_API_KEY;
    if (!ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: "ADMIN_API_KEY not set" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });

    const usdValue = Number(body.usd_value);
    const token = String(body.token ?? "").trim();
    const chain = String(body.chain ?? "").trim();
    const username = String(body.username ?? "").trim();

    if (!Number.isFinite(usdValue) || usdValue < GOLD_MIN || usdValue > GOLD_MAX) {
      return NextResponse.json({ ok: true, golden: false, reason: "out_of_range" });
    }
    if (!token || !chain) return NextResponse.json({ ok: true, golden: false, reason: "missing_token_or_chain" });

    const dayStr = todayUTCDateString();

    // Dynamic pacing:
    // Spread remaining slots across remaining time with a floor (2h).
    // Conservative baseline: 24h/5 * 0.6 ≈ 2.88h, floored at 2h.
    const msLeft = msUntilNextUtcReset(new Date());
    const baselineGap = Math.floor((msLeft / 1000) / DAILY_CAP * 0.6);
    const jitterExtraSeconds = crypto.randomInt(0, GAP_JITTER_MAX_SECONDS + 1);
    const minGapSeconds = Math.max(MIN_GAP_FLOOR_SECONDS, baselineGap) + jitterExtraSeconds;

    // 1) Atomically take a paced daily slot
    type GoldenSlot = { allowed: boolean; new_count: number; next_allowed_at: string | null };

    const { data: slot, error: slotErr } = await supabaseAdmin
      .rpc("dd_take_golden_slot", { p_day: dayStr, p_cap: DAILY_CAP, p_min_gap_seconds: minGapSeconds })
      .single<GoldenSlot>();

    if (slotErr) {
      console.error("[golden] slot rpc failed:", slotErr);
      return NextResponse.json(
        { ok: false, error: "slot_rpc_failed", detail: slotErr.message },
        { status: 500 }
      );
    }

    if (!slot?.allowed) {
      return NextResponse.json({
        ok: true,
        golden: false,
        reason: "paced_or_capped",
      });
    }

    // 2) Resolve terminal user
    if (!username) return NextResponse.json({ ok: true, golden: false, reason: "missing_username" });

    const { data: users, error: uErr } = await supabaseAdmin
      .from("dd_terminal_users")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (uErr || !users?.[0]?.id) {
      return NextResponse.json({ ok: true, golden: false, reason: "terminal_user_not_found" });
    }

    const terminal_user_id = users[0].id as string;

    // Optional: attach tg_user_id if linked
    const { data: linkRows } = await supabaseAdmin
      .from("dd_tg_verify_codes")
      .select("tg_user_id")
      .eq("terminal_user_id", terminal_user_id)
      .not("used_at", "is", null)
      .order("used_at", { ascending: false })
      .limit(1);

    const tg_user_id = (linkRows?.[0] as any)?.tg_user_id ?? null;

    // 3) Insert event (broadcasted_at set only after successful send)
    let claim_code = genClaimCode();
    let golden_event_id: string | null = null;

    for (let i = 0; i < 4; i++) {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("dd_tg_golden_events")
        .insert({
          day: dayStr,
          claim_code,
          terminal_user_id,
          terminal_username: username,
          tg_user_id,
          token,
          chain,
          usd_value: usdValue,
          broadcasted_at: null,
        })
        .select("id")
        .limit(1);

      if (!insErr) {
        golden_event_id = (inserted?.[0] as any)?.id ?? null;
        break;
      }

      const msg = String((insErr as any)?.message ?? "").toLowerCase();
      if (msg.includes("duplicate")) {
        claim_code = genClaimCode();
        continue;
      }

      console.error("[golden] insert event failed:", insErr);
      return NextResponse.json({ ok: false, error: "golden_event_insert_failed" }, { status: 500 });
    }

    // 4) Broadcast message
    const timeLeftHMS = formatHMS(msLeft);
    const message = buildMessage({
      token,
      chain,
      usd: usdValue,
      claim: claim_code,
      slotNumber: Number(slot?.new_count ?? 0),
      slotCap: DAILY_CAP,
      timeLeftHMS,
    });

    const br = await fetch(`${SITE}/api/admin/telegram/broadcast`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": ADMIN_KEY },
      body: JSON.stringify({
        mode: "send",
        message,
        includeTypes: ["supergroup"],
        maxSend: 1,
        delayMs: 400,
      }),
    });

    const out = await br.json().catch(() => ({}));
    const broadcast_sent = inferBroadcastSent(out);

    if (broadcast_sent && golden_event_id) {
      const { error: bErr } = await supabaseAdmin
        .from("dd_tg_golden_events")
        .update({ broadcasted_at: new Date().toISOString() })
        .eq("id", golden_event_id);

      if (bErr) console.error("[golden] broadcasted_at update failed:", bErr);
    }

    return NextResponse.json({
      ok: true,
      golden: true,
      claim_code,
      terminal_user_id,
      tg_user_id,
      golden_slot: Number(slot?.new_count ?? 0),
      golden_cap: DAILY_CAP,
      utc_reset_in: timeLeftHMS,
      broadcast_sent,
      broadcast_message: broadcast_sent ? message : null,
      broadcast: out,
      pacing: {
        min_gap_seconds: minGapSeconds,
      },

    });
  } catch (e: any) {
    console.error("[golden] unexpected:", e);
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
