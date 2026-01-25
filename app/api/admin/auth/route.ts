import { NextRequest, NextResponse } from "next/server";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function timingSafeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? "");

  const correct = env("ADMIN_PIN");
  if (!pin || !timingSafeEq(pin, correct)) {
    return NextResponse.json({ ok: false, error: "invalid_pin" }, { status: 401 });
  }

  const secret = env("ADMIN_COOKIE_SECRET");
  // simple token; good enough for now
  const token = Buffer.from(`${Date.now()}:${secret}`).toString("base64url");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dd_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
  return res;
}
