import "server-only";

import type { SafeAdminUser } from "./auth.schemas";
import { AuthDomainError } from "./auth.service";
import { ADMIN_SESSION_COOKIE } from "./cookie";

interface CookieStore {
  get(name: string): { value: string } | undefined;
}

interface RequireAdminDependencies {
  authenticate?(token: string, now: Date): Promise<SafeAdminUser>;
  cookieStore?(): Promise<CookieStore>;
  now?: () => Date;
}

export async function requireAdmin(
  dependencies: RequireAdminDependencies = {},
): Promise<SafeAdminUser> {
  const cookieStore =
    dependencies.cookieStore ??
    (async () => {
      const { cookies } = await import("next/headers");
      return cookies();
    });
  const store = await cookieStore();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    throw new AuthDomainError("UNAUTHORIZED");
  }

  const authenticate = dependencies.authenticate ?? authenticateFromDatabase;
  return authenticate(token, (dependencies.now ?? (() => new Date()))());
}

async function authenticateFromDatabase(
  token: string,
  now: Date,
): Promise<SafeAdminUser> {
  const [{ getServerEnv }, { createAuthService }, { DrizzleAuthRepository }, {
    DrizzleRateLimitRepository,
  }] = await Promise.all([
    import("@/lib/env/server"),
    import("./auth.service"),
    import("./auth.repository"),
    import("@/modules/leads/rate-limit.repository"),
  ]);
  const env = getServerEnv();
  return createAuthService({
    authRepository: new DrizzleAuthRepository(),
    rateLimitRepository: new DrizzleRateLimitRepository(),
    sessionSecret: env.SESSION_SECRET,
  }).authenticate(token, now);
}
