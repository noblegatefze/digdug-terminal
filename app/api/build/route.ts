import { NextResponse } from "next/server";
import { DISPLAY_VERSION } from "@/app/lib/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const buildVersion = DISPLAY_VERSION;
  const buildHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  // Optional kill-switch (leave unset for now)
  const minBuild = process.env.NEXT_PUBLIC_MIN_TERMINAL_BUILD ?? null;

  return NextResponse.json({
    ok: true,
    build_version: buildVersion,
    build_hash: buildHash,
    min_build: minBuild,
    ts: Date.now(),
  });
}
