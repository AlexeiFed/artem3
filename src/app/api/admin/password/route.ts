import { isSameOrigin } from "@/lib/http/origin";
import {
  PayloadTooLargeError,
  readLimitedJson,
} from "@/lib/http/read-limited-json";
import {
  AuthErrorResponseSchema,
  type SafeAdminUser,
} from "@/modules/auth/auth.schemas";
import { AuthDomainError } from "@/modules/auth/auth.service";
import { readSessionToken } from "@/modules/auth/cookie";

interface ChangePasswordHandlerDependencies {
  requireAdmin(): Promise<SafeAdminUser>;
  changePassword(
    userId: string,
    sessionToken: string,
    input: unknown,
  ): Promise<void>;
  siteUrl: string;
}

const NO_STORE = { "Cache-Control": "no-store" };
const BODY_MAX = 8 * 1_024;

export function createChangePasswordHandler({
  requireAdmin,
  changePassword,
  siteUrl,
}: ChangePasswordHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleChangePassword(
    request: Request,
  ): Promise<Response> {
    if (!isSameOrigin(request, siteUrl)) {
      return errorResponse(403, "FORBIDDEN", "Запрос отклонён.");
    }

    let admin: SafeAdminUser;
    try {
      admin = await requireAdmin();
    } catch (error) {
      if (error instanceof AuthDomainError && error.code === "UNAUTHORIZED") {
        return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
      }
      console.error({
        event: "admin_password_auth_failed",
        category: "internal",
      });
      return errorResponse(500, "INTERNAL", "Не удалось сменить пароль.");
    }

    const sessionToken = readSessionToken(request.headers.get("cookie"));
    if (!sessionToken) {
      return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
    }

    let input: unknown;
    try {
      input = await readLimitedJson(request, BODY_MAX);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        return errorResponse(
          413,
          "PAYLOAD_TOO_LARGE",
          "Размер запроса превышает допустимый.",
        );
      }
      return errorResponse(400, "VALIDATION", "Некорректный запрос.");
    }

    try {
      await changePassword(admin.id, sessionToken, input);
      const { recordAuditEvent } = await import("@/modules/audit/audit");
      await recordAuditEvent({
        action: "admin.password_change",
        actorUserId: admin.id,
      });
      return Response.json({ ok: true }, { status: 200, headers: NO_STORE });
    } catch (error) {
      if (error instanceof AuthDomainError) {
        if (error.code === "VALIDATION") {
          return errorResponse(
            400,
            "VALIDATION",
            "Проверьте заполненные поля.",
            error.fields,
          );
        }
        if (error.code === "INVALID_CREDENTIALS") {
          return errorResponse(
            401,
            "INVALID_CREDENTIALS",
            "Неверный текущий пароль.",
            error.fields,
          );
        }
        if (error.code === "UNAUTHORIZED") {
          return errorResponse(401, "UNAUTHORIZED", "Требуется вход.");
        }
        if (error.code === "RATE_LIMITED") {
          return errorResponse(
            429,
            "RATE_LIMITED",
            "Слишком много попыток смены пароля. Попробуйте позже.",
          );
        }
      }
      console.error({
        event: "admin_password_change_failed",
        category: "internal",
      });
      return errorResponse(500, "INTERNAL", "Не удалось сменить пароль.");
    }
  };
}

function errorResponse(
  status: number,
  code:
    | "VALIDATION"
    | "FORBIDDEN"
    | "PAYLOAD_TOO_LARGE"
    | "INVALID_CREDENTIALS"
    | "RATE_LIMITED"
    | "UNAUTHORIZED"
    | "INTERNAL",
  message: string,
  fields?: Record<string, string[]>,
): Response {
  const body = AuthErrorResponseSchema.parse({
    error: {
      code,
      message,
      ...(fields === undefined ? {} : { fields }),
    },
  });
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request): Promise<Response> {
  const [
    { requireAdmin },
    { getPublicEnv },
    { getServerEnv },
    { createAuthService },
    { DrizzleAuthRepository },
    { DrizzleRateLimitRepository },
  ] = await Promise.all([
    import("@/modules/auth/require-admin"),
    import("@/lib/env/public"),
    import("@/lib/env/server"),
    import("@/modules/auth/auth.service"),
    import("@/modules/auth/auth.repository"),
    import("@/modules/leads/rate-limit.repository"),
  ]);

  const env = getServerEnv();
  const auth = createAuthService({
    authRepository: new DrizzleAuthRepository(),
    rateLimitRepository: new DrizzleRateLimitRepository(),
    sessionSecret: env.SESSION_SECRET,
  });

  return createChangePasswordHandler({
    requireAdmin,
    changePassword: (userId, sessionToken, input) =>
      auth.changePassword(userId, sessionToken, input),
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
  })(request);
}
