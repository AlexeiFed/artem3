import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createLogoutHandler } from "./route";

function request(origin?: string, cookie?: string): Request {
  return new Request("https://example.test/api/admin/logout", {
    method: "POST",
    headers: {
      ...(origin === undefined ? {} : { Origin: origin }),
      ...(cookie === undefined ? {} : { Cookie: cookie }),
    },
  });
}

describe("POST /api/admin/logout", () => {
  it("deletes the database session and always expires the cookie", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const handler = createLogoutHandler({
      logout,
      siteUrl: "https://example.test",
    });

    const response = await handler(
      request("https://example.test", `admin_session=${"A".repeat(43)}`),
    );
    const cookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")];
    const serialized = cookies.join("\n");

    expect(response.status).toBe(204);
    expect(logout).toHaveBeenCalledWith("A".repeat(43));
    expect(serialized).toMatch(/admin_session=;/);
    expect(serialized).toMatch(/__Host-admin_session=;/);
    expect(serialized).toMatch(/Max-Age=0/);
    expect(serialized).toMatch(/HttpOnly/);
    expect(serialized).toMatch(/SameSite=Strict/);
    expect(serialized).toMatch(/Path=\//);
    expect(serialized).toMatch(/Secure/);
  });

  it("rejects mismatched Origin without mutating the cookie or database", async () => {
    const logout = vi.fn();
    const handler = createLogoutHandler({
      logout,
      siteUrl: "https://example.test",
    });

    const response = await handler(request("https://evil.test"));

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(logout).not.toHaveBeenCalled();
  });
});
