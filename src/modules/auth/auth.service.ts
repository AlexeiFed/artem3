import "server-only";

import { createHmac } from "node:crypto";
import type { z } from "zod";

import type { RateLimitRepository } from "@/modules/leads/rate-limit.repository";

import { LoginInputSchema, type SafeAdminUser } from "./auth.schemas";
import type { AuthRepository } from "./auth.repository";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "./password";
import {
  createSessionMaterial,
  hashSessionToken,
  SESSION_ACTIVITY_INTERVAL_MS,
  type SessionMaterial,
} from "./session";

const LOGIN_RATE_LIMIT_ACTION_IP = "admin:login:ip";
const LOGIN_RATE_LIMIT_ACTION_EMAIL = "admin:login:email";
const LOGIN_RATE_LIMIT_MAXIMUM = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type AuthErrorCode =
  | "VALIDATION"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "PERSISTENCE";

export class AuthDomainError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly fields?: Record<string, string[]>,
    readonly retryAfterSeconds?: number,
    cause?: Error,
  ) {
    super(code, cause ? { cause } : undefined);
    this.name = "AuthDomainError";
  }
}

export interface LoginContext {
  clientIp: string;
  now: Date;
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: SafeAdminUser;
}

export interface AuthServiceDependencies {
  authRepository: AuthRepository;
  rateLimitRepository: RateLimitRepository;
  sessionSecret: string;
  verifyPassword?: (passwordHash: string, password: string) => Promise<boolean>;
  createSession?: (now: Date) => SessionMaterial;
}

export interface AuthService {
  login(input: unknown, context: LoginContext): Promise<LoginResult>;
  authenticate(token: string, now: Date): Promise<SafeAdminUser>;
  logout(token: string): Promise<void>;
}

export function createAuthService({
  authRepository,
  rateLimitRepository,
  sessionSecret,
  verifyPassword: verify = verifyPassword,
  createSession = createSessionMaterial,
}: AuthServiceDependencies): AuthService {
  return {
    async login(input: unknown, context: LoginContext): Promise<LoginResult> {
      const parsed = LoginInputSchema.safeParse(input);
      if (!parsed.success) {
        throw validationError(parsed.error);
      }

      const windowStart = new Date(
        Math.floor(context.now.getTime() / LOGIN_RATE_LIMIT_WINDOW_MS) *
          LOGIN_RATE_LIMIT_WINDOW_MS,
      );
      const [ipCount, emailCount] = await Promise.all([
        incrementLoginBucket(
          rateLimitRepository,
          sessionSecret,
          context.clientIp,
          LOGIN_RATE_LIMIT_ACTION_IP,
          windowStart,
        ),
        incrementLoginBucket(
          rateLimitRepository,
          sessionSecret,
          parsed.data.email,
          LOGIN_RATE_LIMIT_ACTION_EMAIL,
          windowStart,
        ),
      ]);

      if (
        ipCount > LOGIN_RATE_LIMIT_MAXIMUM ||
        emailCount > LOGIN_RATE_LIMIT_MAXIMUM
      ) {
        throw new AuthDomainError(
          "RATE_LIMITED",
          undefined,
          retryAfterSeconds(windowStart, context.now),
        );
      }

      let user;
      try {
        user = await authRepository.findUserByEmail(parsed.data.email);
      } catch (error) {
        throw persistenceError(error);
      }

      const passwordMatches = await verify(
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        parsed.data.password,
      );
      if (!user || !user.active || !passwordMatches) {
        throw new AuthDomainError("INVALID_CREDENTIALS");
      }

      const session = createSession(context.now);
      try {
        await authRepository.insertSession({
          userId: user.id,
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
          now: context.now,
        });
      } catch (error) {
        throw persistenceError(error);
      }

      return {
        token: session.token,
        expiresAt: session.expiresAt,
        user: { id: user.id, email: user.email },
      };
    },

    async authenticate(token: string, now: Date): Promise<SafeAdminUser> {
      if (!SESSION_TOKEN_PATTERN.test(token)) {
        throw new AuthDomainError("UNAUTHORIZED");
      }

      const tokenHash = hashSessionToken(token);
      let session;
      try {
        session = await authRepository.findSessionByTokenHash(tokenHash);
      } catch (error) {
        throw persistenceError(error);
      }

      if (!session) {
        throw new AuthDomainError("UNAUTHORIZED");
      }

      if (!session.user.active || session.expiresAt.getTime() <= now.getTime()) {
        try {
          await authRepository.deleteSessionByTokenHash(tokenHash);
        } catch {
          // Authentication still fails if best-effort cleanup cannot complete.
        }
        throw new AuthDomainError("UNAUTHORIZED");
      }

      if (
        session.lastActivityAt.getTime() <=
        now.getTime() - SESSION_ACTIVITY_INTERVAL_MS
      ) {
        try {
          await authRepository.touchSessionActivity(tokenHash, now);
        } catch {
          // Activity is advisory and must not make a valid session unavailable.
        }
      }

      return { id: session.user.id, email: session.user.email };
    },

    async logout(token: string): Promise<void> {
      if (!SESSION_TOKEN_PATTERN.test(token)) {
        return;
      }
      await authRepository.deleteSessionByTokenHash(hashSessionToken(token));
    },
  };
}

async function incrementLoginBucket(
  repository: RateLimitRepository,
  secret: string,
  value: string,
  action: string,
  windowStart: Date,
): Promise<number> {
  try {
    return await repository.increment({
      hashedKey: createHmac("sha256", secret).update(value).digest("hex"),
      action,
      windowStart,
    });
  } catch (error) {
    throw persistenceError(error);
  }
}

function retryAfterSeconds(windowStart: Date, now: Date): number {
  return Math.max(
    1,
    Math.ceil(
      (windowStart.getTime() + LOGIN_RATE_LIMIT_WINDOW_MS - now.getTime()) /
        1_000,
    ),
  );
}

function validationError(error: z.ZodError): AuthDomainError {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "_form";
    (fields[field] ??= []).push(issue.message);
  }
  return new AuthDomainError("VALIDATION", fields);
}

function persistenceError(error: unknown): AuthDomainError {
  const cause =
    error instanceof Error ? error : new Error("Non-Error persistence failure");
  return new AuthDomainError("PERSISTENCE", undefined, undefined, cause);
}
