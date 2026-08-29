import { isSameOrigin } from "@/lib/http/origin";
import { AuthErrorResponseSchema } from "@/modules/auth/auth.schemas";
import {
  expiredSessionCookies,
  readSessionToken,
} from "@/modules/auth/cookie";

interface LogoutHandlerDependencies {
  logout(token: string): Promise<void>;
  siteUrl: string;
}

export function createLogoutHandler({
  logout,
  siteUrl,
}: LogoutHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleLogout(request: Request): Promise<Response> {
    if (!isSameOrigin(request, siteUrl)) {
      const body = AuthErrorResponseSchema.parse({
        error: { code: "FORBIDDEN", message: "Запрос отклонён." },
      });
      return Response.json(body, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const cookies = expiredSessionCookies(
      new URL(siteUrl).protocol === "https:",
    );
    const token = readSessionToken(request.headers.get("cookie"));
    if (token) {
      try {
        await logout(token);
      } catch {
        console.error({
          event: "admin_logout_cleanup_failed",
          category: "persistence",
        });
      }
    }

    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const cookie of cookies) {
      headers.append("Set-Cookie", cookie);
    }

    return new Response(null, {
      status: 204,
      headers,
    });
  };
}

async function logoutFromDatabase(token: string): Promise<void> {
  const [{ getServerEnv }, { createAuthService }, { DrizzleAuthRepository }, {
    DrizzleRateLimitRepository,
  }] = await Promise.all([
    import("@/lib/env/server"),
    import("@/modules/auth/auth.service"),
    import("@/modules/auth/auth.repository"),
    import("@/modules/leads/rate-limit.repository"),
  ]);
  const env = getServerEnv();
  await createAuthService({
    authRepository: new DrizzleAuthRepository(),
    rateLimitRepository: new DrizzleRateLimitRepository(),
    sessionSecret: env.SESSION_SECRET,
  }).logout(token);
  const { recordAuditEvent } = await import("@/modules/audit/audit");
  await recordAuditEvent({ action: "admin.logout" });
}

export async function POST(request: Request): Promise<Response> {
  const { getPublicEnv } = await import("@/lib/env/public");
  return createLogoutHandler({
    logout: logoutFromDatabase,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
  })(request);
}
