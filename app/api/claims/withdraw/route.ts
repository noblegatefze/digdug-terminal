import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { claim_id } = await req.json();

  if (!claim_id) {
    return NextResponse.json({ error: "Missing claim_id" }, { status: 400 });
  }

  // Mark claim as WITHDRAWN
  const { data, error } = await supabase
    .from("dd_treasure_claims")
    .update({
      status: "WITHDRAWN",
      withdrawn_at: new Date().toISOString(),
    })
    .eq("id", claim_id)
    .eq("status", "CLAIMED")
    .select("id, status, withdrawn_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Claim not found or already withdrawn" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, claim: data });
}
