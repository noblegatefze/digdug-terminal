import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username || username.length < 3) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  // simple pass hash (Phase Zero)
  const pass = crypto.randomBytes(4).toString("hex");
  const passHash = crypto.createHash("sha256").update(pass).digest("hex");

  const { data, error } = await supabase
    .from("dd_terminal_users")
    .insert({
      username,
      pass_hash: passHash,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    username,
    terminal_pass: pass,
  });
}
