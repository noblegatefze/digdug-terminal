import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("dd_admin")?.value;
  return NextResponse.json({ ok: Boolean(token) });
}
