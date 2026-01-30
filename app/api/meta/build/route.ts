import { NextResponse } from "next/server";
import { APP_VERSION } from "@/app/lib/build";

export async function GET() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "";

  const build = sha ? sha.slice(0, 7) : "local";

  return NextResponse.json({
    version: APP_VERSION,
    build,
    deployed_at: new Date().toISOString(),
  });
}
