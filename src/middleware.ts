import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.APP_ROLE !== "web") {
    return NextResponse.next();
  }

  const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/$/, "");

  if (!apiBaseUrl) {
    return NextResponse.next();
  }

  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, apiBaseUrl);

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: "/api/:path*"
};
