import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AuthDomainError } from "@/modules/auth/auth.service";

import { createSessionHandler } from "./route";

const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.com",
};

describe("GET /api/admin/session", () => {
  it("returns only the safe authenticated user DTO without requiring Origin", async () => {
    const authenticate = vi.fn().mockResolvedValue(USER);
    const handler = createSessionHandler({ authenticate });

    const response = await handler(
      new Request("https://example.test/api/admin/session", {
        headers: { Cookie: `admin_session=${"A".repeat(43)}` },
      }),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ authenticated: true, user: USER });
    expect(JSON.stringify(body)).not.toMatch(/token|hash/i);
  });

  it("returns a stable 401 for missing or invalid sessions", async () => {
    const authenticate = vi
      .fn()
      .mockRejectedValue(new AuthDomainError("UNAUTHORIZED"));
    const handler = createSessionHandler({ authenticate });

    const missing = await handler(
      new Request("https://example.test/api/admin/session"),
    );
    const invalid = await handler(
      new Request("https://example.test/api/admin/session", {
        headers: { Cookie: `admin_session=${"A".repeat(43)}` },
      }),
    );

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    await expect(missing.json()).resolves.toEqual(
      await invalid.clone().json(),
    );
  });
});
