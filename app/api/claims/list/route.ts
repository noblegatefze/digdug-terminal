import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

// Service role because Phase Zero endpoints are server-authoritative.
// Never expose this key client-side.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = (searchParams.get("username") ?? "").trim();

    if (!username) {
      return NextResponse.json({ ok: false, error: "Missing username" }, { status: 400 });
    }

    // Pull latest claimed + withdrawn (we want full history for UI grouping/FIFO)
    const { data, error } = await supabase
      .from("dd_treasure_claims")
      .select("*")
      .eq("username", username)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Normalize to the client model expected in app/page.tsx
    // Note: DB columns: username/box_id/chain_id/token_symbol/token_address/amount/status/created_at/withdrawn_at/id
    const claims = (data ?? []).map((r: any) => ({
      id: String(r.id),
      user: String(r.username),
      campaignId: String(r.box_id),
      chainId: String(r.chain_id),
      tokenSymbol: String(r.token_symbol),
      tokenAddress: String(r.token_address),
      amount: Number(r.amount),
      kind: "TREASURE",
      status: String(r.status),
      createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      withdrawnAt: r.withdrawn_at ? new Date(r.withdrawn_at).getTime() : null,
    }));

    return NextResponse.json({ ok: true, claims });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
