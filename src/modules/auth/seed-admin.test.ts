import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { seedAdminUser } from "./seed-admin";

describe("seedAdminUser", () => {
  it("creates the first administrator as active with a normalized email", async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
    };
    await seedAdminUser(
      { email: "  ADMIN@Example.COM ", password: "first-password-value" },
      {
        repository,
        hashPassword: vi.fn().mockResolvedValue("$argon2id$first"),
      },
    );

    expect(repository.create).toHaveBeenCalledWith({
      email: "admin@example.com",
      passwordHash: "$argon2id$first",
      active: true,
    });
  });

  it("does not rotate an existing administrator password from env", async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: "11111111-1111-4111-8111-111111111111",
        passwordHash: "$argon2id$existing",
        active: true,
      }),
      create: vi.fn(),
    };
    const hashPassword = vi.fn();

    await seedAdminUser(
      { email: "admin@example.com", password: "rotated-password-value" },
      {
        repository,
        hashPassword,
      },
    );

    expect(hashPassword).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
