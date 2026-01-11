import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Admin auth for this endpoint: simple shared secret header
// Set this in Vercel env: ADMIN_API_KEY
function requireAdmin(req: NextRequest) {
  const got = req.headers.get("x-admin-key") || "";
  const expected = reqEnv("ADMIN_API_KEY");
  if (!got || got !== expected) {
    return false;
  }
  return true;
}

const supabaseAdmin = createClient(
  reqEnv("SUPABASE_URL"),
  reqEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

type ChatRow = {
  chat_id: string; // comes back as string for bigint
  chat_type: string | null;
  title: string | null;
  username: string | null;
  last_seen_at: string | null;
  created_at: string | null;
};

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Filters (all optional)
  const includeTypes: string[] = Array.isArray(body.includeTypes) ? body.includeTypes : []; // e.g. ["private","supergroup"]
  const activeWithinHours: number | null =
    typeof body.activeWithinHours === "number" ? body.activeWithinHours : null;
  const limit: number = typeof body.limit === "number" ? Math.max(1, Math.min(5000, body.limit)) : 5000;

  let q = supabaseAdmin
    .from("dd_tg_chats")
    .select("chat_id, chat_type, title, username, last_seen_at, created_at")
    .order("last_seen_at", { ascending: false })
    .limit(limit);

  if (includeTypes.length > 0) {
    q = q.in("chat_type", includeTypes);
  }

  if (activeWithinHours != null) {
    const cutoff = new Date(Date.now() - activeWithinHours * 3600 * 1000).toISOString();
    q = q.gte("last_seen_at", cutoff);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[broadcast dryrun] query error:", error);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  const rows = (data || []) as ChatRow[];

  const byType: Record<string, number> = {};
  for (const r of rows) {
    const t = r.chat_type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
  }

  // Sample output (first 10)
  const sample = rows.slice(0, 10).map((r) => ({
    chat_id: r.chat_id,
    chat_type: r.chat_type,
    title: r.title,
    username: r.username,
    last_seen_at: r.last_seen_at,
  }));

  // Telegram safe batching rule-of-thumb:
  // keep <= 25 msgs/sec overall; we'll implement real throttling in Step 3B.
  const batchSize = 25;
  const batches = Math.ceil(rows.length / batchSize);

  return NextResponse.json({
    ok: true,
    mode: "dry_run",
    filters: {
      includeTypes: includeTypes.length ? includeTypes : null,
      activeWithinHours,
      limit,
    },
    counts: {
      total: rows.length,
      byType,
      batches,
      batchSize,
    },
    sample,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/admin/telegram/broadcast", mode: "dry_run_only" });
}
