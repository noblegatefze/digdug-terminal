import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

function nowIso() {
  return new Date().toISOString();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const username = String(body?.username ?? "").trim();
  const box_id = String(body?.box_id ?? "").trim();

  if (!username || !box_id) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  // 1) resolve user
  const { data: user, error: uerr } = await supabase
    .from("dd_terminal_users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (uerr || !user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  // 2) resolve box rules
  const { data: box, error: berr } = await supabase
    .from("dd_boxes")
    .select("id, cooldown_hours, max_digs_per_user, status")
    .eq("id", box_id)
    .single();

  if (berr || !box) {
    return NextResponse.json({ ok: false, error: "Box not found" }, { status: 404 });
  }

  if (String(box.status) !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Box inactive" }, { status: 400 });
  }

  const maxDigs: number | null =
    box.max_digs_per_user == null ? null : Number(box.max_digs_per_user);

  const cooldownHours = Number(box.cooldown_hours ?? 0);
  const cooldownMs = Math.max(0, cooldownHours) * 3600 * 1000;

  // 3) load gate row (if any)
  const { data: gateRow } = await supabase
    .from("dd_box_dig_gate")
    .select("count,last_at")
    .eq("box_id", box_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const count = Number(gateRow?.count ?? 0);
  const lastAt = gateRow?.last_at ? new Date(String(gateRow.last_at)).getTime() : null;

  // 4) enforce max digs
  if (maxDigs != null && count >= maxDigs) {
    return NextResponse.json({
      ok: false,
      allowed: false,
      reason: "limit",
      count,
      maxDigs,
      nextAllowedAt: null,
    });
  }

  // 5) enforce cooldown
  if (cooldownMs > 0 && lastAt != null) {
    const next = lastAt + cooldownMs;
    if (Date.now() < next) {
      return NextResponse.json({
        ok: false,
        allowed: false,
        reason: "cooldown",
        count,
        maxDigs,
        nextAllowedAt: new Date(next).toISOString(),
      });
    }
  }

  // 6) allow + increment
  const nextCount = count + 1;

  const { error: upErr } = await supabase
    .from("dd_box_dig_gate")
    .upsert(
      {
        box_id,
        user_id: user.id,
        count: nextCount,
        last_at: nowIso(),
      },
      { onConflict: "box_id,user_id" }
    );

  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    allowed: true,
    count: nextCount,
    maxDigs,
    nextAllowedAt: cooldownMs > 0 ? new Date(Date.now() + cooldownMs).toISOString() : null,
  });
}
