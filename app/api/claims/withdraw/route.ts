import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function asText(v: any): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

export async function POST(req: NextRequest) {
  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const claim_id = asText(body?.claim_id);
  const to_address = asText(body?.to_address);

  if (!claim_id) return NextResponse.json({ ok: false, error: "missing_claim_id" }, { status: 400 });
  if (!to_address) return NextResponse.json({ ok: false, error: "missing_to_address" }, { status: 400 });

  // ✅ Canonical: create withdrawal intent (DB enforces protocol gating)
  const { data, error } = await supabase.rpc("rpc_withdraw_request", {
    p_claim_id: claim_id,
    p_to_address: to_address,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const ok = Boolean(data?.ok);

  if (!ok) {
    const err = data?.error ?? "withdraw_request_failed";

    // withdrawals disabled is a policy decision, not a server crash
    if (err === "withdrawals_disabled") {
      return NextResponse.json(
        {
          ok: false,
          error: "withdrawals_disabled",
          message:
            "Withdrawals are currently disabled by protocol state (VIRTUAL/MOCK). Your claim remains safely offchain.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: false, error: err, details: data ?? null }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      withdrawal: {
        withdrawal_id: data.withdrawal_id,
        claim_id: data.claim_id,
        status: data.status,
        token_mode: data.token_mode,
        phase_mode: data.phase_mode,
      },
    },
    { status: 200 }
  );
}
