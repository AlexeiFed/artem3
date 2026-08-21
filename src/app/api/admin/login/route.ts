import { isSameOrigin } from "@/lib/http/origin";
import {
  PayloadTooLargeError,
  readLimitedJson,
} from "@/lib/http/read-limited-json";
import {
  AuthenticatedSessionResponseSchema,
  AuthErrorResponseSchema,
} from "@/modules/auth/auth.schemas";
import {
  AuthDomainError,
  type LoginContext,
  type LoginResult,
} from "@/modules/auth/auth.service";
import { extractTrustedClientIp } from "@/modules/leads/client-ip";

interface LoginHandlerDependencies {
  login(input: unknown, context: LoginContext): Promise<LoginResult>;
  siteUrl: string;
  trustedProxyHops?: number;
  now?: () => Date;
}

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const LOGIN_BODY_MAXIMUM_BYTES = 8 * 1_024;

export function createLoginHandler({
  login,
  siteUrl,
  trustedProxyHops = 1,
  now = () => new Date(),
}: LoginHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleLogin(request: Request): Promise<Response> {
    if (!isSameOrigin(request, siteUrl)) {
      return errorResponse(403, "FORBIDDEN", "Запрос отклонён.");
    }

    let input: unknown;
    try {
      input = await readLimitedJson(request, LOGIN_BODY_MAXIMUM_BYTES);
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
      const result = await login(input, {
        clientIp: extractTrustedClientIp(request.headers, trustedProxyHops),
        now: now(),
      });
      const body = AuthenticatedSessionResponseSchema.parse({
        authenticated: true,
        user: result.user,
      });

      return Response.json(body, {
        status: 200,
        headers: {
          ...NO_STORE_HEADERS,
          "Set-Cookie": serializeSessionCookie(result.token, siteUrl),
        },
      });
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
          const rateLimit = error.rateLimit;
          const remaining = rateLimit?.attemptsRemaining;
          const limit = rateLimit?.attemptsLimit;
          const message =
            remaining === undefined || limit === undefined || !rateLimit
              ? "Неверная почта или пароль."
              : `Неверная почта или пароль. Осталось попыток: ${remaining} из ${limit}. Лимит сбросится ${formatResetsAt(rateLimit.resetsAt)}.`;
          return errorResponse(
            401,
            "INVALID_CREDENTIALS",
            message,
            undefined,
            undefined,
            rateLimit,
          );
        }
        if (error.code === "RATE_LIMITED") {
          const rateLimit = error.rateLimit;
          const retryAfter =
            error.retryAfterSeconds ?? rateLimit?.retryAfterSeconds ?? 1;
          const limit = rateLimit?.attemptsLimit ?? 5;
          const message = `Слишком много попыток: лимит ${limit} за 15 минут. Повторите через ${formatDuration(retryAfter)} (сброс ${formatResetsAt(rateLimit?.resetsAt ?? new Date(Date.now() + retryAfter * 1000).toISOString())}).`;
          return errorResponse(
            429,
            "RATE_LIMITED",
            message,
            undefined,
            retryAfter,
            rateLimit,
          );
        }
      }

      console.error({
        event: "admin_login_failed",
        category: "internal",
        errorClass:
          error instanceof AuthDomainError
            ? "AuthDomainError"
            : error instanceof Error
              ? "Error"
              : "UnknownError",
      });
      return errorResponse(
        500,
        "INTERNAL",
        "Не удалось выполнить вход. Попробуйте позже.",
      );
    }
  };
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds} с`;
  if (seconds === 0) return `${minutes} мин`;
  return `${minutes} мин ${seconds} с`;
}

function formatResetsAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function serializeSessionCookie(token: string, siteUrl: string): string {
  const secure = new URL(siteUrl).protocol === "https:";
  return [
    `admin_session=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

function errorResponse(
  status: number,
  code:
    | "VALIDATION"
    | "FORBIDDEN"
    | "PAYLOAD_TOO_LARGE"
    | "INVALID_CREDENTIALS"
    | "RATE_LIMITED"
    | "INTERNAL",
  message: string,
  fields?: Record<string, string[]>,
  retryAfterSeconds?: number,
  rateLimit?: {
    attemptsRemaining: number;
    attemptsLimit: number;
    retryAfterSeconds: number;
    resetsAt: string;
  },
): Response {
  const body = AuthErrorResponseSchema.parse({
    error: {
      code,
      message,
      ...(fields === undefined ? {} : { fields }),
      ...(retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds }),
      ...(rateLimit === undefined
        ? {}
        : {
            attemptsRemaining: rateLimit.attemptsRemaining,
            attemptsLimit: rateLimit.attemptsLimit,
            retryAfterSeconds:
              retryAfterSeconds ?? rateLimit.retryAfterSeconds,
            resetsAt: rateLimit.resetsAt,
          }),
    },
  });

  return Response.json(body, {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      ...(retryAfterSeconds === undefined
        ? {}
        : { "Retry-After": String(retryAfterSeconds) }),
    },
  });
}

async function loginWithDatabase(
  input: unknown,
  context: LoginContext,
): Promise<LoginResult> {
  const [
    { getServerEnv },
    { createAuthService },
    { DrizzleAuthRepository },
    { DrizzleRateLimitRepository },
  ] = await Promise.all([
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
  }).login(input, context);
}

export async function POST(request: Request): Promise<Response> {
  const [{ getPublicEnv }, { getServerEnv }] = await Promise.all([
    import("@/lib/env/public"),
    import("@/lib/env/server"),
  ]);
  const handler = createLoginHandler({
    login: loginWithDatabase,
    siteUrl: getPublicEnv().NEXT_PUBLIC_SITE_URL,
    trustedProxyHops: getServerEnv().TRUSTED_PROXY_HOPS,
  });
  return handler(request);
}
