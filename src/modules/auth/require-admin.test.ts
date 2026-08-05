import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

import { AuthDomainError } from "./auth.service";
import { requireAdmin, requireAdminOrRedirect } from "./require-admin";

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

describe("requireAdminOrRedirect", () => {
  it("redirects to login on UNAUTHORIZED without mutating cookies in RSC", async () => {
    const deleteCookie = vi.fn();
    const cookieStore = vi.fn().mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "A".repeat(43) }),
      delete: deleteCookie,
    });
    const authenticate = vi
      .fn()
      .mockRejectedValue(new AuthDomainError("UNAUTHORIZED"));

    await expect(
      requireAdminOrRedirect("/admin/honesty", { authenticate, cookieStore }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(deleteCookie).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(
      "/admin/login?next=%2Fadmin%2Fhonesty",
    );
  });
});
