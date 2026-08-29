import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/modules/auth/cookie";

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (request.cookies.has(ADMIN_SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
