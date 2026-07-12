import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { seedAdminUser } from "./seed-admin";

describe("seedAdminUser", () => {
  it("creates the first administrator as active with a normalized email", async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      rotatePasswordAndRevokeSessions: vi.fn(),
    };
    await seedAdminUser(
      { email: "  ADMIN@Example.COM ", password: "first-password-value" },
      {
        repository,
        hashPassword: vi.fn().mockResolvedValue("$argon2id$first"),
        verifyPassword: vi.fn(),
      },
    );

    expect(repository.create).toHaveBeenCalledWith({
      email: "admin@example.com",
      passwordHash: "$argon2id$first",
      active: true,
    });
    expect(repository.rotatePasswordAndRevokeSessions).not.toHaveBeenCalled();
  });

  it("does not write when the environment password matches the existing hash", async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: "11111111-1111-4111-8111-111111111111",
        passwordHash: "$argon2id$existing",
        active: false,
      }),
      create: vi.fn(),
      rotatePasswordAndRevokeSessions: vi.fn(),
    };
    const hashPassword = vi.fn();

    await seedAdminUser(
      { email: "admin@example.com", password: "existing-password-value" },
      {
        repository,
        hashPassword,
        verifyPassword: vi.fn().mockResolvedValue(true),
      },
    );

    expect(hashPassword).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.rotatePasswordAndRevokeSessions).not.toHaveBeenCalled();
  });

  it("rotates a changed password and revokes sessions without activating the user", async () => {
    const state = {
      active: false,
      passwordHash: "$argon2id$existing",
      sessionIds: ["session-1", "session-2"],
    };
    const repository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: "11111111-1111-4111-8111-111111111111",
        passwordHash: state.passwordHash,
        active: state.active,
      }),
      create: vi.fn(),
      rotatePasswordAndRevokeSessions: vi.fn(
        async ({ passwordHash }: { userId: string; passwordHash: string }) => {
          state.passwordHash = passwordHash;
          state.sessionIds = [];
        },
      ),
    };

    await seedAdminUser(
      { email: "admin@example.com", password: "rotated-password-value" },
      {
        repository,
        hashPassword: vi.fn().mockResolvedValue("$argon2id$rotated"),
        verifyPassword: vi.fn().mockResolvedValue(false),
      },
    );

    expect(repository.rotatePasswordAndRevokeSessions).toHaveBeenCalledWith({
      userId: "11111111-1111-4111-8111-111111111111",
      passwordHash: "$argon2id$rotated",
    });
    expect(state).toEqual({
      active: false,
      passwordHash: "$argon2id$rotated",
      sessionIds: [],
    });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
