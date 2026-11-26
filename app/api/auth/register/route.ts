import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { ok: false, error: "Legacy Terminal registration is closed." },
    { status: 410 }
  );
}
