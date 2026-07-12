import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requireAdmin } from "./require-admin";

describe("requireAdmin", () => {
  it("reads the async Next cookie store and validates against the database boundary", async () => {
    const token = "A".repeat(43);
    const authenticate = vi.fn().mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      email: "admin@example.com",
    });
    const cookieStore = vi.fn().mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
    });

    const user = await requireAdmin({ authenticate, cookieStore });

    expect(cookieStore).toHaveBeenCalledOnce();
    expect(authenticate).toHaveBeenCalledWith(token, expect.any(Date));
    expect(user.email).toBe("admin@example.com");
  });
});
