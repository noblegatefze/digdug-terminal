import { NextRequest, NextResponse } from "next/server";

const destinations: Record<string, string> = {
  "/surface-dispatch": "https://feed.digdug.do/",
  "/legacy-terminal": "https://old.digdug.do/",
};

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, "");
  const destination = destinations[path];
  if (!destination) return NextResponse.next();
  const url = new URL(destination);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 307);
}

export const config = { matcher: ["/surface-dispatch", "/legacy-terminal"] };
