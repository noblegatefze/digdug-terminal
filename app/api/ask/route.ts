import { NextResponse } from "next/server";
import { askBrain } from "@/lib/brain/answer";

export async function POST(req: Request) {
  const { q } = await req.json();
  if (!q) {
    return NextResponse.json({ ok: false, error: "Missing question" }, { status: 400 });
  }

  const result = await askBrain(q);
  return NextResponse.json({ ok: true, ...result });
}
