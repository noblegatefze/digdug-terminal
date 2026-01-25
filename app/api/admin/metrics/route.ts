import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function isAuthed(req: NextRequest) {
  return Boolean(req.cookies.get("dd_admin")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false }, { status: 401 });

  // Pull last 10 min events (we'll aggregate in JS)
  const sinceIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from("stats_events")
    .select("created_at, install_id, event, usddd_cost")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(20000); // safety cap

  const list = rows ?? [];

  // Aggregate by minute
  const byMinuteMap = new Map<string, { minute: string; events: number; usddd_cost_sum: number }>();
  for (const r of list) {
    const d = new Date(r.created_at as any);
    d.setSeconds(0, 0);
    const key = d.toISOString();
    const cur = byMinuteMap.get(key) ?? { minute: key, events: 0, usddd_cost_sum: 0 };
    cur.events += 1;
    cur.usddd_cost_sum += Number(r.usddd_cost ?? 0);
    byMinuteMap.set(key, cur);
  }
  const byMinute = Array.from(byMinuteMap.values()).sort((a, b) => (a.minute < b.minute ? 1 : -1));

  // Top installs (dig_success only)
  const topMap = new Map<string, { install_id: string; n: number; usddd_cost_sum: number; last_seen: string }>();
  for (const r of list) {
    if (r.event !== "dig_success") continue;
    const id = String(r.install_id ?? "");
    if (!id) continue;
    const cur = topMap.get(id) ?? { install_id: id, n: 0, usddd_cost_sum: 0, last_seen: String(r.created_at) };
    cur.n += 1;
    cur.usddd_cost_sum += Number(r.usddd_cost ?? 0);
    // list is desc ordered, first seen is newest, but keep max anyway
    if (String(r.created_at) > cur.last_seen) cur.last_seen = String(r.created_at);
    topMap.set(id, cur);
  }
  const topInstalls = Array.from(topMap.values())
    .sort((a, b) => b.usddd_cost_sum - a.usddd_cost_sum)
    .slice(0, 20);

  return NextResponse.json({ ok: true, byMinute, topInstalls });
}
