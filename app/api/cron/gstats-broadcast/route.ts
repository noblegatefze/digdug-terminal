import { NextResponse } from "next/server";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function goldenWindowLabel(p: { today: number; cap: number; nextAllowedAt: any }) {
  const { today, cap, nextAllowedAt } = p;

  if (today >= cap) {
    return { window: "CLOSED", next: "UTC reset" };
  }

  if (!nextAllowedAt) {
    return { window: "OPEN", next: "Any moment" };
  }

  const t = new Date(String(nextAllowedAt)).getTime();
  if (!Number.isFinite(t)) {
    return { window: "UNKNOWN", next: "N/A" };
  }

  const now = Date.now();
  if (t <= now) {
    return { window: "OPEN", next: "Any moment" };
  }

  const mins = Math.ceil((t - now) / 60000);

  // Intentionally vague (don’t train users to wait for a specific time)
  if (mins <= 10) return { window: "LOCKED", next: "Very soon" };
  if (mins <= 60) return { window: "LOCKED", next: "Soon" };
  if (mins <= 180) return { window: "LOCKED", next: "Later" };
  return { window: "LOCKED", next: "Later today" };
}

function asciiGstatsMessage(data: any) {
  const attempts = Number(data?.digs_attempted ?? 0);
  const finds = Number(data?.digs_succeeded ?? 0);
  const rejected = Math.max(0, attempts - finds);
  const rate = attempts > 0 ? (finds / attempts) * 100 : 0;

  const usdddSpent = data?.usddd_spent != null ? Number(data.usddd_spent) : null;
  const withdrawals = data?.withdrawals ?? "N/A";

  const totalSessions = data?.total_sessions ?? "N/A";
  const activeNow = data?.active_now_5m ?? "N/A";
  const dailyActive = data?.daily_active ?? "N/A";

  const boxesCreated = data?.boxes_created ?? null;
  const boxesLiveNow = data?.boxes_live_now ?? null;

  // ✅ Golden Find stats (added in /api/stats/summary)
  const goldenToday = Number(data?.golden_today ?? 0);
  const goldenCap = Number(data?.golden_cap ?? 5);
  const goldenResetIn = String(data?.golden_reset_in ?? "N/A");
  const goldenNextAllowedAt = data?.golden_next_allowed_at ?? null;

  const lines: string[] = [];
  lines.push("DIGDUG.DO — GLOBAL PULSE (6H)");
  lines.push("");

  lines.push("NETWORK");
  lines.push(`- Sessions: ${totalSessions}`);
  lines.push(`- Active now (5m): ${activeNow}`);
  lines.push(`- Daily diggers (today): ${dailyActive}`);
  lines.push("");

  lines.push("DIGGING");
  lines.push(`- Attempts: ${attempts}`);
  lines.push(`- Finds: ${finds}`);
  lines.push(`- Find rate: ${rate.toFixed(2)}%`);
  if (rejected > 0) lines.push(`- Rejected: ${rejected}`);
  lines.push("");

  // ✅ Golden section
  const g = goldenWindowLabel({ today: goldenToday, cap: goldenCap, nextAllowedAt: goldenNextAllowedAt });

  lines.push("GOLDEN FINDS");
  lines.push(`- Today: ${goldenToday}/${goldenCap}`);
  lines.push(`- Window: ${g.window}`);
  lines.push(`- Next window: ${g.next}`);
  lines.push(`- UTC reset in: ${goldenResetIn}`);
  lines.push("");

  lines.push("FUEL");
  lines.push(`- USDDD spent: ${usdddSpent == null ? "N/A" : usdddSpent.toFixed(2)}`);
  if (usdddSpent != null) {
    const avg = attempts > 0 ? usdddSpent / attempts : 0;
    lines.push(`- Avg fuel/attempt: ${avg.toFixed(2)}`);
  }
  lines.push(`- Withdrawals: ${withdrawals}`);

  if (boxesCreated != null || boxesLiveNow != null) {
    lines.push("");
    lines.push("BOXES");
    if (boxesCreated != null) lines.push(`- Created: ${boxesCreated}`);
    if (boxesLiveNow != null) lines.push(`- Live now: ${boxesLiveNow}`);
  }

  // optional: top boxes
  if (Array.isArray(data?.top_boxes) && data.top_boxes.length > 0) {
    lines.push("");
    lines.push("TOP BOXES (by digs)");
    data.top_boxes.slice(0, 5).forEach((b: any, i: number) => {
      const bid = b?.box_id ?? "?";
      const ch = b?.chain ?? "?";
      const digs = b?.digs ?? "?";
      lines.push(`${i + 1}) ${bid} (${ch}) — ${digs} digs`);
    });
  }

  return lines.join("\n");
}

export async function GET() {
  const ADMIN_KEY = process.env.ADMIN_API_KEY;
  if (!ADMIN_KEY) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_API_KEY not set" },
      { status: 500 }
    );
  }

  // 1) Fetch stats from internal endpoint
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://digdug.do";

  const r = await fetch(`${base}/api/stats/summary`, { method: "GET" });
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `stats_http_${r.status}` }, { status: 500 });
  }
  const data = await r.json();

  const message = asciiGstatsMessage(data);

  // 2) Broadcast to supergroup/group only (safe)
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
