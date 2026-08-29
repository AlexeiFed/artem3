import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "./proxy";

describe("admin proxy", () => {
  it("allows the login page without a cookie", () => {
    const response = proxy(
      new NextRequest("https://example.test/admin/login?next=%2Fadmin"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects a protected admin path with a safe relative next value", () => {
    const response = proxy(
      new NextRequest("https://example.test/admin/cases?status=open"),
    );
    const location = new URL(response.headers.get("location") ?? "");

    expect(response.status).toBe(307);
    expect(location.origin).toBe("https://example.test");
    expect(location.pathname).toBe("/admin/login");
    expect(location.searchParams.get("next")).toBe(
      "/admin/cases?status=open",
    );
  });

  it("rejects a cookie that is not a session token", () => {
    const response = proxy(
      new NextRequest("https://example.test/admin", {
        headers: { Cookie: "admin_session=not-authoritative" },
      }),
    );

    expect(response.status).toBe(307);
  });

  it("lets a well-formed session cookie through the presence check", () => {
    const response = proxy(
      new NextRequest("https://example.test/admin", {
        headers: { Cookie: `admin_session=${"A".repeat(43)}` },
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("content-security-policy")).toContain(
      "strict-dynamic",
    );
  });

  it("does not expire the session cookie when opening the login page", () => {
    const response = proxy(
      new NextRequest("https://example.test/admin/login", {
        headers: { Cookie: "admin_session=not-authoritative" },
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
