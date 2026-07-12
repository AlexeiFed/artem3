import {
  AuthenticatedSessionResponseSchema,
  AuthErrorResponseSchema,
  type SafeAdminUser,
} from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { readSessionToken } from "@/modules/auth/cookie";

interface SessionHandlerDependencies {
  authenticate(token: string, now: Date): Promise<SafeAdminUser>;
  now?: () => Date;
}

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export function createSessionHandler({
  authenticate,
  now = () => new Date(),
}: SessionHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleSession(request: Request): Promise<Response> {
    const token = readSessionToken(request.headers.get("cookie"));
    if (!token) {
      return unauthorizedResponse();
    }

    try {
      const user = await authenticate(token, now());
      const body = AuthenticatedSessionResponseSchema.parse({
        authenticated: true,
        user,
      });
      return Response.json(body, { status: 200, headers: NO_STORE_HEADERS });
    } catch (error) {
      if (
        error instanceof AuthDomainError &&
        error.code === "UNAUTHORIZED"
      ) {
        return unauthorizedResponse();
      }

      console.error({
        event: "admin_session_lookup_failed",
        category: "persistence",
        errorClass: error instanceof Error ? "Error" : "UnknownError",
      });
      const body = AuthErrorResponseSchema.parse({
        error: {
          code: "INTERNAL",
          message: "Не удалось проверить сессию.",
        },
      });
      return Response.json(body, {
        status: 500,
        headers: NO_STORE_HEADERS,
      });
    }
  };
}

function unauthorizedResponse(): Response {
  const body = AuthErrorResponseSchema.parse({
    error: {
      code: "UNAUTHORIZED",
      message: "Требуется вход.",
    },
  });
  return Response.json(body, { status: 401, headers: NO_STORE_HEADERS });
}

async function authenticateFromDatabase(
  token: string,
  now: Date,
): Promise<SafeAdminUser> {
  const [{ getServerEnv }, { createAuthService }, { DrizzleAuthRepository }, {
    DrizzleRateLimitRepository,
  }] = await Promise.all([
    import("@/lib/env/server"),
    import("@/modules/auth/auth.service"),
    import("@/modules/auth/auth.repository"),
    import("@/modules/leads/rate-limit.repository"),
  ]);
  const env = getServerEnv();
  return createAuthService({
    authRepository: new DrizzleAuthRepository(),
    rateLimitRepository: new DrizzleRateLimitRepository(),
    sessionSecret: env.SESSION_SECRET,
  }).authenticate(token, now);
}

export async function GET(request: Request): Promise<Response> {
  return createSessionHandler({
    authenticate: authenticateFromDatabase,
  })(request);
}
