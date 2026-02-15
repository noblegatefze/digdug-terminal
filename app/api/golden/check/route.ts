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

// Window config (locked defaults)
const WINDOW_MINUTES = 6;
const WINDOWS_PER_DAY = 5;

// ------------------------------------------------------------
// Anti-storm (server-side only)
// ------------------------------------------------------------
const GLOBAL_MIN_CALL_MS = 10_000; // hard throttle per instance
const IDENTITY_COOLDOWN_MS = 15_000; // per identity cooldown
const NEGATIVE_CACHE_MS = 20_000; // per identity short cache for negatives

type Cached = { at: number; body: any; ttl: number };

// In-flight de-dupe
let _inFlight: Promise<NextResponse> | null = null;

// Global last-call timestamp (hard throttle)
let _lastAttemptAt = 0;

// Per-identity cooldowns
const _cooldowns = new Map<string, number>();
const _negCache = new Map<string, Cached>();

function nowMs() {
  return Date.now();
}

function getIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip") || "ip:unknown";
}

function cooldownKey(parts: { username?: string; install_id?: string; ip?: string }) {
  if (parts.username) return `u:${parts.username.toLowerCase()}`;
  if (parts.install_id) return `i:${parts.install_id}`;
  if (parts.ip) return `p:${parts.ip}`;
  return "k:unknown";
}

function shouldServeNegCache(key: string): Cached | null {
  const c = _negCache.get(key) ?? null;
  if (!c) return null;
  const age = nowMs() - c.at;
  if (age <= c.ttl) return c;
  _negCache.delete(key);
  return null;
}

function setNegCache(key: string, body: any, ttl: number) {
  _negCache.set(key, { at: nowMs(), body, ttl });
}

function todayUTCDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function genClaimCodeDeterministic(seed: Buffer, counter: number) {
  // Deterministic-ish claim code generation to reduce collisions (still random-looking)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const h = crypto.createHash("sha256").update(seed).update(String(counter)).digest();
  let out = "GF-";
  for (let i = 0; i < 4; i++) {
    out += chars[h[i] % chars.length];
  }
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

function asNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------
// Deterministic daily windows
// ---------------------------
function prngFromSeed(seed: Buffer) {
  // xorshift32 from first 4 bytes
  let x = seed.readUInt32LE(0) ^ 0x9e3779b9;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // 0..1
    return (x >>> 0) / 0xffffffff;
  };
}

function computeWindowsForDay(dayStr: string, secret: string) {
  // 5 windows/day, each WINDOW_MINUTES
  // Choose open minute offsets across the day with spacing.
  const seed = crypto.createHmac("sha256", secret).update(dayStr).digest();
  const rnd = prngFromSeed(seed);

  const dayStart = new Date(`${dayStr}T00:00:00.000Z`).getTime();

  const minOpen = 30; // don't start at exactly midnight
  const maxOpen = 24 * 60 - WINDOW_MINUTES - 30;
  const minGap = 120; // minimum 2 hours spacing between windows

  const picks: number[] = [];
  let guard = 0;

  while (picks.length < WINDOWS_PER_DAY && guard++ < 10_000) {
    const candidate = Math.floor(minOpen + rnd() * (maxOpen - minOpen));

    // spacing check
    let ok = true;
    for (const p of picks) {
      if (Math.abs(p - candidate) < minGap) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    picks.push(candidate);
  }

  picks.sort((a, b) => a - b);

  const rows = picks.slice(0, WINDOWS_PER_DAY).map((minuteOffset, i) => {
    const opensAtMs = dayStart + minuteOffset * 60_000;
    const closesAtMs = opensAtMs + WINDOW_MINUTES * 60_000;
    return {
      day: dayStr,
      slot: i + 1,
      opens_at: new Date(opensAtMs).toISOString(),
      closes_at: new Date(closesAtMs).toISOString(),
      claimed_event_id: null as any,
    };
  });

  return { seed, rows };
}

async function ensureWindowsExist(dayStr: string) {
  const secret = process.env.DD_GOLDEN_WINDOWS_SECRET;
  if (!secret || secret.length < 16) throw new Error("Missing/weak env: DD_GOLDEN_WINDOWS_SECRET");

  // If any rows exist for today, do nothing (don’t reshuffle live day)
  const { data: existing, error: exErr } = await supabaseAdmin
    .from("dd_tg_golden_windows")
    .select("day,slot")
    .eq("day", dayStr)
    .limit(1);

  if (exErr) throw exErr;
  if (existing && existing.length > 0) return;

  const { rows } = computeWindowsForDay(dayStr, secret);

  // Upsert 5 rows
  const { error: upErr } = await supabaseAdmin
    .from("dd_tg_golden_windows")
    .upsert(rows, { onConflict: "day,slot" });

  if (upErr) throw upErr;
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
  const install_id = String(body.install_id ?? "").trim();

  // ✅ REQUIRED: dig_id must be canonical server dig_id
  let dig_id: string | null = String(body.dig_id ?? body.digId ?? "").trim();
  if (!dig_id) dig_id = null;

  // Fast reject: out of reward range / missing fields
  if (!Number.isFinite(usdValue) || usdValue < GOLD_MIN || usdValue > GOLD_MAX) {
    return NextResponse.json({ ok: true, golden: false, reason: "out_of_range" });
  }
  if (!token || !chain) return NextResponse.json({ ok: true, golden: false, reason: "missing_token_or_chain" });
  if (!username) return NextResponse.json({ ok: true, golden: false, reason: "missing_username" });
  if (!dig_id) return NextResponse.json({ ok: true, golden: false, reason: "missing_dig_id" });

  // ------------------------
  // Anti-storm before DB
  // ------------------------
  const n = nowMs();
  const ip = getIp(req);
  const idKey = cooldownKey({ username, install_id, ip });

  const cachedNeg = shouldServeNegCache(idKey);
  if (cachedNeg) return NextResponse.json(cachedNeg.body);

  if (n - _lastAttemptAt < GLOBAL_MIN_CALL_MS) {
    const out = { ok: true, golden: false, reason: "server_throttled" };
    setNegCache(idKey, out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  const until = _cooldowns.get(idKey) ?? 0;
  if (n < until) {
    const out = { ok: true, golden: false, reason: "cooldown" };
    setNegCache(idKey, out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  _cooldowns.set(idKey, n + IDENTITY_COOLDOWN_MS);
  _lastAttemptAt = n;

  // keep map bounded
  if (_cooldowns.size > 50_000) {
    const cutoff = n - 5 * 60_000;
    for (const [k, t] of _cooldowns) if (t < cutoff) _cooldowns.delete(k);
  }

  const dayStr = todayUTCDateString();

  // Ensure windows exist for today (one-time per day)
  try {
    await ensureWindowsExist(dayStr);
  } catch (e: any) {
    console.error("[golden] ensureWindowsExist failed:", e);
    return NextResponse.json({ ok: false, error: "windows_seed_failed" }, { status: 500 });
  }

  // Resolve terminal user
  const { data: users, error: uErr } = await supabaseAdmin
    .from("dd_terminal_users")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (uErr || !users?.[0]?.id) {
    const out = { ok: true, golden: false, reason: "terminal_user_not_found" };
    setNegCache(idKey, out, NEGATIVE_CACHE_MS);
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

  // Attempt award (atomic window claim + event insert)
  type AwardRow = { ok: boolean; golden: boolean; slot: number | null; claim_code: string | null; golden_event_id: string | null };

  const nowIso = new Date().toISOString();

  const { data: award, error: aErr } = await supabaseAdmin
    .rpc("dd_golden_try_award", {
      p_day: dayStr,        // Postgres will coerce to date
      p_now: nowIso,        // timestamptz
      p_terminal_user_id: terminal_user_id,
      p_terminal_username: username,
      p_tg_user_id: tg_user_id,
      p_token: token,
      p_chain: chain,
      p_usd_value: usdValue,
      p_dig_id: dig_id,
    })
    .single<AwardRow>();

  if (aErr) {
    console.error("[golden] dd_golden_try_award failed:", aErr);
    return NextResponse.json({ ok: false, error: "award_rpc_failed", detail: aErr.message }, { status: 500 });
  }

  if (!award?.ok || !award.golden) {
    const out = { ok: true, golden: false, reason: "no_open_window" };
    setNegCache(idKey, out, NEGATIVE_CACHE_MS);
    return NextResponse.json(out);
  }

  const claim_code = String(award.claim_code ?? "").trim();
  const golden_event_id = String(award.golden_event_id ?? "").trim();
  const msLeft = msUntilNextUtcReset(new Date());
  const timeLeftHMS = formatHMS(msLeft);

  // Compute "Golden Find X/5" as number of claimed windows today (only on win; max 5/day)
  let claimedCount = 1;
  try {
    const { count } = await supabaseAdmin
      .from("dd_tg_golden_windows")
      .select("*", { count: "exact", head: true })
      .eq("day", dayStr)
      .not("claimed_event_id", "is", null);
    if (typeof count === "number" && count > 0) claimedCount = count;
  } catch {
    // ignore; fallback stays 1
  }

  // Broadcast message
  const message = buildMessage({
    token,
    chain,
    usd: usdValue,
    claim: claim_code,
    slotNumber: claimedCount,
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

  // ------------------------------------------------------------
  // Canonical Golden Claim (ledger-first) (kept as your current best-effort)
  // ------------------------------------------------------------
  try {
    const chainIdNum = asNum(chain, 0);
    let token_address: string | null = null;

    const { data: boxRow, error: boxErr } = await supabaseAdmin
      .from("dd_boxes")
      .select("token_address")
      .eq("token_symbol", token)
      .eq("deploy_chain_id", chainIdNum)
      .limit(1)
      .maybeSingle();

    if (!boxErr) {
      const addr = String((boxRow as any)?.token_address ?? "").trim();
      token_address = addr || null;
    }

    let price_usd = 0;
    if (token_address) {
      const { data: pxRow, error: pxErr } = await supabaseAdmin
        .from("dd_token_price_snapshots_addr")
        .select("price_usd")
        .eq("chain_id", chainIdNum)
        .eq("token_address", token_address)
        .lte("as_of", new Date().toISOString())
        .order("as_of", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pxErr) price_usd = asNum((pxRow as any)?.price_usd ?? 0, 0);
    }

    const amount = price_usd > 0 ? usdValue / price_usd : 0;

    const { error: gErr } = await supabaseAdmin.from("dd_treasure_claims").insert({
      created_at: new Date().toISOString(),
      username,
      box_id: "golden",
      dig_id,
      chain_id: chainIdNum || null,
      token_symbol: token,
      token_address: token_address,
      amount,
      status: "CLAIMED",
      find_tier: "GOLDEN FIND",
      is_golden: true,
    });

    if (gErr) {
      const msg = String((gErr as any)?.message ?? "").toLowerCase();
      if (!msg.includes("duplicate") && !msg.includes("unique")) {
        console.error("[golden] canonical golden claim insert failed:", gErr);
      }
    }
  } catch (e) {
    console.error("[golden] canonical golden claim unexpected:", e);
  }

  const responseBody = {
    ok: true,
    golden: true,
    claim_code,
    terminal_user_id,
    tg_user_id,
    dig_id,
    golden_slot: claimedCount,
    golden_cap: DAILY_CAP,
    utc_reset_in: timeLeftHMS,
    broadcast_sent,
    broadcast_message: broadcast_sent ? message : null,
    broadcast: outBr,
    window: {
      slot: award.slot,
      minutes: WINDOW_MINUTES,
    },
  };

  return NextResponse.json(responseBody);
}

export async function POST(req: Request) {
  try {
    if (_inFlight) return _inFlight;

    _inFlight = handle(req)
      .catch((e: any) => {
        console.error("[golden] unexpected:", e);
        return NextResponse.json(
          { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
          { status: 500 }
        );
      })
      .finally(() => {
        _inFlight = null;
      });

    return _inFlight;
  } catch (e: any) {
    console.error("[golden] unexpected outer:", e);
    return NextResponse.json(
      { ok: false, error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
