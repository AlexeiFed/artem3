import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "./password";
import {
  createSessionMaterial,
  hashSessionToken,
  SESSION_TTL_MS,
} from "./session";
import {
  createAuthService,
  type AuthServiceDependencies,
} from "./auth.service";
import type {
  AdminSessionRecord,
  AdminUserRecord,
  AuthRepository,
} from "./auth.repository";
import type { RateLimitRepository } from "@/modules/leads/rate-limit.repository";

describe("password", () => {
  it("hashes with Argon2id and verifies only the original password", async () => {
    const hash = await hashPassword("a-strong-password-value");

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyPassword(hash, "a-strong-password-value"),
    ).resolves.toBe(true);
    await expect(verifyPassword(hash, "another-password-value")).resolves.toBe(
      false,
    );
  });

  it("keeps a valid fixed Argon2id hash for absent-user verification", async () => {
    await expect(
      verifyPassword(DUMMY_PASSWORD_HASH, "dummy-auth-password"),
    ).resolves.toBe(true);
  });
});

describe("session material", () => {
  it("creates a 32-byte base64url token and stores only its SHA-256 hash", () => {
    const now = new Date("2026-07-12T10:00:00.000Z");
    const session = createSessionMaterial(now);

    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(session.tokenHash).toBe(hashSessionToken(session.token));
    expect(session.tokenHash).not.toContain(session.token);
    expect(session.expiresAt.getTime()).toBe(now.getTime() + SESSION_TTL_MS);
  });
});

const USER: AdminUserRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.com",
  passwordHash: "$argon2id$real",
  active: true,
};

function dependencies(
  overrides: Partial<AuthServiceDependencies> = {},
): AuthServiceDependencies & {
  authRepository: AuthRepository;
  rateLimitRepository: RateLimitRepository;
} {
  const authRepository: AuthRepository = {
    findUserByEmail: vi.fn().mockResolvedValue(USER),
    findUserById: vi.fn().mockResolvedValue(USER),
    insertSession: vi.fn().mockResolvedValue(undefined),
    findSessionByTokenHash: vi.fn().mockResolvedValue(null),
    deleteSessionByTokenHash: vi.fn().mockResolvedValue(undefined),
    touchSessionActivity: vi.fn().mockResolvedValue(undefined),
    updatePasswordAndRevokeOtherSessions: vi.fn().mockResolvedValue(undefined),
  };
  const rateLimitRepository: RateLimitRepository = {
    increment: vi.fn().mockResolvedValue(1),
    deleteOlderThan: vi.fn().mockResolvedValue(undefined),
  };

  return {
    authRepository,
    rateLimitRepository,
    sessionSecret: "s".repeat(32),
    verifyPassword: vi.fn().mockResolvedValue(true),
    createSession: () => ({
      token: "A".repeat(43),
      tokenHash: "b".repeat(64),
      expiresAt: new Date("2026-07-19T10:00:00.000Z"),
    }),
    ...overrides,
  };
}

describe("auth service", () => {
  it("normalizes email, limits both IP and email buckets, and creates a session", async () => {
    const deps = dependencies();
    const service = createAuthService(deps);
    const now = new Date("2026-07-12T10:00:00.000Z");

    const result = await service.login(
      { email: "  ADMIN@Example.COM ", password: "correct-password" },
      { clientIp: "203.0.113.5", now },
    );

    expect(deps.rateLimitRepository.increment).toHaveBeenCalledTimes(2);
    expect(deps.authRepository.findUserByEmail).toHaveBeenCalledWith(
      "admin@example.com",
    );
    expect(deps.authRepository.insertSession).toHaveBeenCalledWith({
      userId: USER.id,
      tokenHash: "b".repeat(64),
      expiresAt: new Date("2026-07-19T10:00:00.000Z"),
      now,
    });
    expect(result).toEqual({
      token: "A".repeat(43),
      expiresAt: new Date("2026-07-19T10:00:00.000Z"),
      user: { id: USER.id, email: USER.email },
    });
  });

  it("prunes rate-limit windows older than 24 hours once per fresh IP window", async () => {
    const deps = dependencies();
    const deleteOlderThan = vi.mocked(
      deps.rateLimitRepository.deleteOlderThan,
    );
    const now = new Date("2026-07-12T10:00:00.000Z");

    await createAuthService(deps).login(
      { email: "admin@example.com", password: "correct-password" },
      { clientIp: "203.0.113.5", now },
    );

    expect(deleteOlderThan).toHaveBeenCalledOnce();
    expect(deleteOlderThan).toHaveBeenCalledWith(
      new Date("2026-07-11T10:00:00.000Z"),
    );
  });

  it("uses the fixed dummy hash and returns the same invalid-credentials error", async () => {
    const verify = vi.fn().mockResolvedValue(false);
    const deps = dependencies({
      authRepository: {
        ...dependencies().authRepository,
        findUserByEmail: vi.fn().mockResolvedValue(null),
      },
      verifyPassword: verify,
    });
    const service = createAuthService(deps);

    await expect(
      service.login(
        {
          email: "missing@example.com",
          password: "wrong-password-value",
        },
        { clientIp: "203.0.113.5", now: new Date() },
      ),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(verify).toHaveBeenCalledWith(
      expect.stringMatching(/^\$argon2id\$/),
      "wrong-password-value",
    );
  });

  it("attaches remaining login attempts on invalid credentials", async () => {
    const verifyPassword = vi.fn().mockResolvedValue(false);
    const deps = dependencies({
      rateLimitRepository: {
        increment: vi
          .fn()
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(2),
        deleteOlderThan: vi.fn().mockResolvedValue(undefined),
      },
      verifyPassword,
    });

    await expect(
      createAuthService(deps).login(
        { email: "admin@example.com", password: "wrong-password-xx" },
        {
          clientIp: "203.0.113.5",
          now: new Date("2026-07-12T10:01:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      rateLimit: {
        attemptsRemaining: 3,
        attemptsLimit: 5,
      },
    });
  });

  it("returns generic rate limiting when either bucket exceeds five attempts", async () => {
    const deps = dependencies({
      rateLimitRepository: {
        increment: vi
          .fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(6),
        deleteOlderThan: vi.fn().mockResolvedValue(undefined),
      },
    });

    await expect(
      createAuthService(deps).login(
        { email: "admin@example.com", password: "correct-password" },
        {
          clientIp: "203.0.113.5",
          now: new Date("2026-07-12T10:01:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(deps.authRepository.findUserByEmail).not.toHaveBeenCalled();
  });

  it("stops before consuming the email bucket when the IP bucket is blocked", async () => {
    const increment = vi.fn().mockResolvedValue(6);
    const deps = dependencies({
      rateLimitRepository: {
        increment,
        deleteOlderThan: vi.fn().mockResolvedValue(undefined),
      },
    });

    await expect(
      createAuthService(deps).login(
        { email: "first@example.com", password: "correct-password" },
        {
          clientIp: "203.0.113.5",
          now: new Date("2026-07-12T10:01:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });

    expect(increment).toHaveBeenCalledOnce();
    expect(increment).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin:login:ip" }),
    );
  });

  it("does not create email buckets for unique emails after the IP is blocked", async () => {
    const increment = vi.fn().mockResolvedValue(6);
    const deps = dependencies({
      rateLimitRepository: {
        increment,
        deleteOlderThan: vi.fn().mockResolvedValue(undefined),
      },
    });
    const service = createAuthService(deps);
    const context = {
      clientIp: "203.0.113.5",
      now: new Date("2026-07-12T10:01:00.000Z"),
    };

    await expect(
      service.login(
        { email: "first@example.com", password: "correct-password" },
        context,
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
    await expect(
      service.login(
        { email: "second@example.com", password: "correct-password" },
        context,
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });

    expect(increment).toHaveBeenCalledTimes(2);
    expect(
      increment.mock.calls.map(([input]) => input.action),
    ).toEqual(["admin:login:ip", "admin:login:ip"]);
  });

  it.each([
    ["expired", true, new Date("2026-07-12T09:59:59.000Z")],
    ["inactive", false, new Date("2026-07-13T10:00:00.000Z")],
  ])("rejects %s sessions", async (_case, active, expiresAt) => {
    const record: AdminSessionRecord = {
      tokenHash: "b".repeat(64),
      expiresAt,
      lastActivityAt: new Date("2026-07-12T08:00:00.000Z"),
      user: { id: USER.id, email: USER.email, active },
    };
    const deps = dependencies({
      authRepository: {
        ...dependencies().authRepository,
        findSessionByTokenHash: vi.fn().mockResolvedValue(record),
      },
    });

    await expect(
      createAuthService(deps).authenticate(
        "A".repeat(43),
        new Date("2026-07-12T10:00:00.000Z"),
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(deps.authRepository.deleteSessionByTokenHash).toHaveBeenCalledWith(
      hashSessionToken("A".repeat(43)),
    );
  });
});

describe("changePassword", () => {
  const sessionToken = "B".repeat(43);

  it("rejects wrong current password", async () => {
    const deps = dependencies({
      verifyPassword: vi.fn().mockResolvedValue(false),
    });

    await expect(
      createAuthService(deps).changePassword(USER.id, sessionToken, {
        currentPassword: "wrong-password-xx",
        newPassword: "brand-new-password",
      }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(
      deps.authRepository.updatePasswordAndRevokeOtherSessions,
    ).not.toHaveBeenCalled();
  });

  it("hashes the new password and keeps the current session", async () => {
    const deps = dependencies({
      verifyPassword: vi.fn().mockResolvedValue(true),
      hashPassword: vi.fn().mockResolvedValue("$argon2id$new"),
    });

    await createAuthService(deps).changePassword(USER.id, sessionToken, {
      currentPassword: "a-strong-password",
      newPassword: "brand-new-password",
    });

    expect(
      deps.authRepository.updatePasswordAndRevokeOtherSessions,
    ).toHaveBeenCalledWith({
      userId: USER.id,
      passwordHash: "$argon2id$new",
      keepTokenHash: hashSessionToken(sessionToken),
    });
  });
});
