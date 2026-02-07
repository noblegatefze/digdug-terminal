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

// ------------------------------------------------------------
// Emergency anti-storm patch (server-side only)
// ------------------------------------------------------------
//
// Why: dd_take_golden_slot was called millions of times.
// This route MUST tolerate spam without hammering Supabase.
//
// This patch does NOT change golden logic; it only throttles
// how often this endpoint can attempt a golden slot.
//
// Notes:
// - Uses in-memory cache per server instance (Vercel lambda).
// - Also uses per-identity short cooldowns to prevent tight loops.
// - Includes in-flight de-dupe to avoid concurrency stampedes.
// ------------------------------------------------------------

const GLOBAL_MIN_CALL_MS = 30_000; // never attempt golden slot more often than every 30s per instance
const IDENTITY_COOLDOWN_MS = 20_000; // per-user/install/ip cooldown window
const SUCCESS_CACHE_MS = 30_000; // cache positive golden result briefly
const NEGATIVE_CACHE_MS = 30_000; // cache negative results briefly

type Cached = { at: number; body: any; ttl: number };

// Global cache (single response cache)
let _cache: Cached | null = null;

// In-flight de-dupe (avoid 50 concurrent requests all hitting DB)
let _inFlight: Promise<NextResponse> | null = null;

// Global last-call timestamp (hard throttle)
let _lastAttemptAt = 0;

// Per-identity cooldowns
const _cooldowns = new Map<string, number>();

function nowMs() {
  return Date.now();
}

function getIp(req: Request): string {
  // Vercel / proxies: x-forwarded-for may contain a list
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip") || "ip:unknown";
}

function cooldownKey(parts: { username?: string; install_id?: string; ip?: string }) {
  // Use stable-ish keys; username is strongest. install_id if provided.
  // Fall back to IP if nothing else.
  if (parts.username) return `u:${parts.username.toLowerCase()}`;
  if (parts.install_id) return `i:${parts.install_id}`;
  if (parts.ip) return `p:${parts.ip}`;
  return "k:unknown";
}

function shouldServeCache(): Cached | null {
  if (!_cache) return null;
  const age = nowMs() - _cache.at;
  if (age <= _cache.ttl) return _cache;
  return null;
}

function setCache(body: any, ttl: number) {
  _cache = { at: nowMs(), body, ttl };
}

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

async function handle(req: Request): Promise<NextResponse> {
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

  // Optional identity fields if caller provides them (does not break if missing)
  const install_id = String(body.install_id ?? "").trim();

  // ✅ NEW: accept dig_id so we can canonically join Golden ↔ Rewards by dig_id
  // Optional; doesn't break callers who don't send it.
  let dig_id: string | null = String(body.dig_id ?? body.digId ?? "").trim();
  if (!dig_id) dig_id = null;

  // Fast reject: out of reward range
  if (!Number.isFinite(usdValue) || usdValue < GOLD_MIN || usdValue > GOLD_MAX) {
    const out = { ok: true, golden: false, reason: "out_of_range" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }
  if (!token || !chain) {
    const out = { ok: true, golden: false, reason: "missing_token_or_chain" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  // Require username to proceed past pacing/rpc
  if (!username) {
    const out = { ok: true, golden: false, reason: "missing_username" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  // ------------------------------------------------------------
  // Anti-storm checks BEFORE calling Supabase
  // ------------------------------------------------------------

  // Serve global cache if warm (covers bursts)
  const cached = shouldServeCache();
  if (cached) return NextResponse.json(cached.body);

  // Global throttle: never attempt more often than GLOBAL_MIN_CALL_MS
  const n = nowMs();
  if (n - _lastAttemptAt < GLOBAL_MIN_CALL_MS) {
    const out = { ok: true, golden: false, reason: "server_throttled" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  // Per-identity cooldown (prevents single client tight loop)
  const ip = getIp(req);
  const key = cooldownKey({ username, install_id, ip });
  const until = _cooldowns.get(key) ?? 0;
  if (n < until) {
    const out = { ok: true, golden: false, reason: "cooldown" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  // Set cooldown immediately (even if later fails) to stop retry storms
  _cooldowns.set(key, n + IDENTITY_COOLDOWN_MS);

  // Hard-prune cooldown map occasionally (keep it bounded)
  if (_cooldowns.size > 50_000) {
    const cutoff = n - 5 * 60_000; // 5 minutes old
    for (const [k, t] of _cooldowns) {
      if (t < cutoff) _cooldowns.delete(k);
    }
  }

  // Mark global attempt time (prevents multi-request stampede)
  _lastAttemptAt = n;

  const dayStr = todayUTCDateString();

  // Dynamic pacing:
  // Spread remaining slots across remaining time with a floor (2h).
  // Conservative baseline: 24h/5 * 0.6 ≈ 2.88h, floored at 2h.
  const msLeft = msUntilNextUtcReset(new Date());
  const baselineGap = Math.floor(msLeft / 1000 / DAILY_CAP * 0.6);
  const jitterExtraSeconds = crypto.randomInt(0, GAP_JITTER_MAX_SECONDS + 1);
  const minGapSeconds = Math.max(MIN_GAP_FLOOR_SECONDS, baselineGap) + jitterExtraSeconds;

  // 1) Atomically take a paced daily slot
  type GoldenSlot = { allowed: boolean; new_count: number; next_allowed_at: string | null };

  const { data: slot, error: slotErr } = await supabaseAdmin
    .rpc("dd_take_golden_slot", { p_day: dayStr, p_cap: DAILY_CAP, p_min_gap_seconds: minGapSeconds })
    .single<GoldenSlot>();

  if (slotErr) {
    console.error("[golden] slot rpc failed:", slotErr);
    const out = { ok: false, error: "slot_rpc_failed", detail: slotErr.message };
    // Cache failures briefly to avoid instant retry storms
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out, { status: 500 });
  }

  if (!slot?.allowed) {
    const out = { ok: true, golden: false, reason: "paced_or_capped" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  // 2) Resolve terminal user
  const { data: users, error: uErr } = await supabaseAdmin
    .from("dd_terminal_users")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (uErr || !users?.[0]?.id) {
    const out = { ok: true, golden: false, reason: "terminal_user_not_found" };
    setCache(out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
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
        dig_id, // ✅ NEW
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

  const outBr = await br.json().catch(() => ({}));
  const broadcast_sent = inferBroadcastSent(outBr);

  if (broadcast_sent && golden_event_id) {
    const { error: bErr } = await supabaseAdmin
      .from("dd_tg_golden_events")
      .update({ broadcasted_at: new Date().toISOString() })
      .eq("id", golden_event_id);

    if (bErr) console.error("[golden] broadcasted_at update failed:", bErr);
  }

  const responseBody = {
    ok: true,
    golden: true,
    claim_code,
    terminal_user_id,
    tg_user_id,
    dig_id, // ✅ NEW (debug + traceability)
    golden_slot: Number(slot?.new_count ?? 0),
    golden_cap: DAILY_CAP,
    utc_reset_in: timeLeftHMS,
    broadcast_sent,
    broadcast_message: broadcast_sent ? message : null,
    broadcast: outBr,
    pacing: {
      min_gap_seconds: minGapSeconds,
    },
  };

  // Cache success slightly longer (prevents duplicate broadcasts on rapid retries)
  setCache(responseBody, SUCCESS_CACHE_MS);

  return NextResponse.json(responseBody);
}

export async function POST(req: Request) {
  try {
    // In-flight de-dupe: if multiple requests arrive at once, share one execution.
    if (_inFlight) return _inFlight;

    _inFlight = handle(req)
      .catch((e: any) => {
        console.error("[golden] unexpected:", e);
        return NextResponse.json({ ok: false, error: "unexpected", detail: String(e?.message ?? e) }, { status: 500 });
      })
      .finally(() => {
        _inFlight = null;
      });

    return _inFlight;
  } catch (e: any) {
    console.error("[golden] unexpected outer:", e);
    return NextResponse.json({ ok: false, error: "unexpected", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
