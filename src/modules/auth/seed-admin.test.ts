import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { seedAdminUser } from "./seed-admin";

describe("seedAdminUser", () => {
  it("normalizes email and upserts a new hash on every password rotation", async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    const hash = vi
      .fn()
      .mockResolvedValueOnce("$argon2id$first")
      .mockResolvedValueOnce("$argon2id$rotated");

    await seedAdminUser(
      { email: "  ADMIN@Example.COM ", password: "first-password-value" },
      { upsert, hashPassword: hash },
    );
    await seedAdminUser(
      { email: "admin@example.com", password: "rotated-password-value" },
      { upsert, hashPassword: hash },
    );

    expect(upsert).toHaveBeenNthCalledWith(1, {
      email: "admin@example.com",
      passwordHash: "$argon2id$first",
    });
    expect(upsert).toHaveBeenNthCalledWith(2, {
      email: "admin@example.com",
      passwordHash: "$argon2id$rotated",
    });
    expect(JSON.stringify(upsert.mock.calls)).not.toMatch(
      /first-password-value|rotated-password-value/,
    );
  });
});
