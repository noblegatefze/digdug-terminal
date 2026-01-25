import { NextResponse } from "next/server";

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "N/A";
  return Math.round(n).toLocaleString("en-US");
}

function fmtNum(n: number | null | undefined, dp = 2): string {
  if (n == null || !Number.isFinite(n)) return "N/A";
  return n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function maskName(s: string): string {
  const x = String(s ?? "").trim();
  if (!x) return "anon";
  if (x.length <= 3) return `${x[0]}…`;
  // keep first char and last char, hide middle
  return `${x[0]}…${x[x.length - 1]}`;
}

type BuildMeta = { version?: string; build?: string };
type Activity24h = {
  counts?: { sessions_24h?: number; protocol_actions?: number; claims_executed?: number };
  money?: { usddd_spent?: number; claims_value_usd?: number };
  model?: { reward_efficiency_usd_per_usddd?: number };
};
type GoldenToday = { today?: number; cap?: number; reset_in?: string } | any;
type GoldenWinnersRow = { winner?: string; usd_total?: number; total_usd?: number } | any;

async function safeJson<T>(r: Response): Promise<T | null> {
  if (!r.ok) return null;
  return (await r.json().catch(() => null)) as T | null;
}

function utcResetInHMS(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = Math.max(0, next.getTime() - now.getTime());
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function buildTgMessage(p: {
  versionLine: string;
  sessions24h: number | null;
  protocolActions24h: number | null;
  successfulFinds24h: number | null;
  goldenToday: number | null;
  goldenCap: number | null;
  goldenResetIn: string | null;
  usdddUtilized24h: number | null;
  valueDistributed24h: number | null;
  rewardEfficiency: number | null;
  winners: { winner: string; usd: number }[];
}) {
  const lines: string[] = [];

  lines.push("DIGDUG.DO — GLOBAL PULSE (6H)");
  lines.push(p.versionLine);
  lines.push("");

  lines.push("NETWORK");
  lines.push(`• Sessions (24h): ${fmtInt(p.sessions24h)}`);
  lines.push(`• Protocol actions (24h): ${fmtInt(p.protocolActions24h)}`);
  lines.push("");

  lines.push("DIGGING (24h)");
  lines.push(`• Successful finds: ${fmtInt(p.successfulFinds24h)}`);
  lines.push("");

  lines.push("GOLDEN FINDS");
  lines.push(`• Today: ${p.goldenToday == null ? "N/A" : p.goldenToday}/${p.goldenCap ?? "N/A"}`);
  lines.push(`• UTC reset in: ${p.goldenResetIn ?? "N/A"}`);
  lines.push("");

  lines.push("VALUE FLOW (24h)");
  lines.push(`• USDDD utilized: ${fmtNum(p.usdddUtilized24h, 2)}`);
  lines.push(`• Value distributed: $${fmtNum(p.valueDistributed24h, 2)}`);
  lines.push(`• Reward efficiency: $${fmtNum(p.rewardEfficiency, 2)} / USDDD`);
  lines.push("");

  lines.push("TOP GOLDEN WINNERS (30d)");
  if (p.winners.length === 0) {
    lines.push("1) N/A");
    lines.push("2) N/A");
    lines.push("3) N/A");
  } else {
    p.winners.slice(0, 3).forEach((w, i) => {
      // IMPORTANT: do not re-mask; winner is already Scan-format
      lines.push(`${i + 1}) ${w.winner} ... $${fmtNum(w.usd, 2)}`);
    });
    // ensure 3 lines always
    for (let i = p.winners.length; i < 3; i++) lines.push(`${i + 1}) N/A`);
  }

  lines.push("");
  lines.push("⛏️ Digging is live. Boxes refill, rewards reset daily.");
  lines.push("");
  lines.push("Live metrics: usddd.digdug.do");
  lines.push("Dig now: digdug.do");

  return lines.join("\n");
}

export async function GET() {
  const ADMIN_KEY = process.env.ADMIN_API_KEY;
  if (!ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "ADMIN_API_KEY not set" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://digdug.do";

  // Canonical metrics surface
  const scanBase = "https://usddd.digdug.do";

  // Fetch all (fail-safe: any can be null)
  const [metaR, actR, goldR, winnersR] = await Promise.all([
    fetch(`${scanBase}/api/meta/build`, { method: "GET", cache: "no-store" }),
    fetch(`${scanBase}/api/activity/24h`, { method: "GET", cache: "no-store" }),
    fetch(`${scanBase}/api/golden/today`, { method: "GET", cache: "no-store" }),
    fetch(`${scanBase}/api/leaderboards/golden-winners`, { method: "GET", cache: "no-store" }),
  ]);

  const meta = await safeJson<BuildMeta>(metaR);
  const act = await safeJson<Activity24h>(actR);
  const gold = await safeJson<GoldenToday>(goldR);
  const winnersRaw = await safeJson<any>(winnersR);

  const version = meta?.version ? String(meta.version) : "v?.?.?.?";
  const build = meta?.build ? String(meta.build) : "unknown";
  const versionLine = `Version ${version} • LIVE (${build})`;

  const sessions24h = act?.counts?.sessions_24h ?? null;
  const protocolActions24h = act?.counts?.protocol_actions ?? null;
  const successfulFinds24h = act?.counts?.claims_executed ?? null;

  const usdddUtilized24h = act?.money?.usddd_spent ?? null;
  const valueDistributed24h = act?.money?.claims_value_usd ?? null;
  const rewardEfficiency = act?.model?.reward_efficiency_usd_per_usddd ?? null;

  // golden/today shape may vary; try common keys
  const goldenToday = Number((gold as any)?.count ?? (gold as any)?.today ?? (gold as any)?.golden_today ?? null);
  const goldenCap = Number((gold as any)?.cap ?? (gold as any)?.golden_cap ?? null);
  const resetInFromApi = (gold as any)?.reset_in ?? (gold as any)?.golden_reset_in ?? null;
  const goldenResetIn =
    typeof resetInFromApi === "string" && resetInFromApi.trim() && resetInFromApi.trim().toUpperCase() !== "N/A"
      ? resetInFromApi.trim()
      : utcResetInHMS();

  // winners endpoint: support either {rows:[...]} or direct array
  const winnersArr: GoldenWinnersRow[] = Array.isArray(winnersRaw)
    ? winnersRaw
    : Array.isArray(winnersRaw?.rows)
      ? winnersRaw.rows
      : Array.isArray(winnersRaw?.data)
        ? winnersRaw.data
        : [];

  const winners = winnersArr
    .map((r) => ({
      // IMPORTANT: match Scan exactly (Scan renders `winner` directly)
      winner: String((r as any)?.winner ?? "anon"),
      usd: Number((r as any)?.usd_total ?? (r as any)?.total_usd ?? (r as any)?.amount_usd ?? 0) || 0,
    }))
    .filter((x) => x.usd > 0);

  const message = buildTgMessage({
    versionLine,
    sessions24h,
    protocolActions24h,
    successfulFinds24h,
    goldenToday: Number.isFinite(goldenToday) ? goldenToday : null,
    goldenCap: Number.isFinite(goldenCap) ? goldenCap : null,
    goldenResetIn: goldenResetIn || "N/A",
    usdddUtilized24h,
    valueDistributed24h,
    rewardEfficiency,
    winners,
  });

  // Broadcast to group/supergroup
  const br = await fetch(`${base}/api/admin/telegram/broadcast`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": ADMIN_KEY,
    },
    body: JSON.stringify({
      mode: "send",
      message,
      includeTypes: ["group", "supergroup"],
      maxSend: 25,
      delayMs: 350,
    }),
  });

  const out = await br.json().catch(() => ({}));
  if (!br.ok || !out?.ok) {
    return NextResponse.json({ ok: false, error: "broadcast_failed", out }, { status: 500 });
  }

  return NextResponse.json({ ok: true, broadcast: out });
}
