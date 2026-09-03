import { type NextRequest, NextResponse } from "next/server";

import { buildContentSecurityPolicy } from "../content-security-policy";
import {
  ADMIN_SESSION_COOKIE,
  HOST_ADMIN_SESSION_COOKIE,
  SESSION_TOKEN_PATTERN,
} from "@/modules/auth/cookie";

function sessionLooksValid(request: NextRequest): boolean {
  const host = request.cookies.get(HOST_ADMIN_SESSION_COOKIE)?.value;
  const legacy = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const token = host ?? legacy;
  return Boolean(token && SESSION_TOKEN_PATTERN.test(token));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const csp = buildContentSecurityPolicy(siteUrl, nonce, {
    allowUnsafeEval: process.env.NODE_ENV !== "production",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let response: NextResponse;
  if (pathname === "/admin/login") {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else if (pathname.startsWith("/admin") && !sessionLooksValid(request)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  response.headers.set("Content-Security-Policy", csp);
  if (siteUrl.startsWith("https://")) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
