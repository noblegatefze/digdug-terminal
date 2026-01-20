import { NextResponse } from "next/server";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const GOLDEN_CAP = 5;

function todayUtcYmd(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
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

export async function GET() {
  try {
    const url = env("SUPABASE_URL");
    const key = env("SUPABASE_SERVICE_ROLE_KEY");

    // 1) Existing summary RPC
    const r = await fetch(`${url}/rest/v1/rpc/stats_summary`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: "rpc_failed", detail: txt.slice(0, 200) },
        { status: 500 }
      );
    }

    const data = await r.json().catch(() => ({}));

    // 2) Golden stats (today UTC)
    const day = todayUtcYmd();

    let golden_today: number | null = null;

    try {
      const gr = await fetch(
        `${url}/rest/v1/dd_tg_golden_daily?select=count&day=eq.${encodeURIComponent(day)}`,
        {
          method: "GET",
          headers: {
            apikey: key,
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
          },
        }
      );

      if (gr.ok) {
        const rows = (await gr.json().catch(() => [])) as any[];
        const row = rows?.[0];
        if (row && typeof row.count === "number") golden_today = row.count;
      }
    } catch {
      // ignore golden enrichment errors (summary must still work)
    }

    const golden_reset_in = formatHMS(msUntilNextUtcReset(new Date()));

    // Return original summary + extra golden fields (no timing leak)
    return NextResponse.json({
      ...data,
      golden_today: golden_today ?? 0,
      golden_cap: GOLDEN_CAP,
      golden_reset_in,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server_error" },
      { status: 500 }
    );
  }
}
