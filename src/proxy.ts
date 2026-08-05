import { type NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/modules/auth/cookie";

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // Логин всегда доступен; сбрасываем битую session-cookie, иначе proxy пускает «в админку» без сессии в БД.
  if (pathname === "/admin/login") {
    const response = NextResponse.next();
    if (request.cookies.has(ADMIN_SESSION_COOKIE)) {
      response.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
    }
    return response;
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
