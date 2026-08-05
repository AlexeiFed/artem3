import type {
  CreateLeadContext,
  CreateLeadResult,
} from "@/modules/leads/create-lead.service";
import { LeadDomainError } from "@/modules/leads/create-lead.service";
import { extractTrustedClientIp } from "@/modules/leads/client-ip";
import {
  LeadPersistenceErrorResponseSchema,
  LeadRateLimitErrorResponseSchema,
  LeadSuccessResponseSchema,
  LeadValidationErrorResponseSchema,
} from "@/modules/leads/lead.schemas";

interface LeadHandlerDependencies {
  createLead(
    input: unknown,
    context: CreateLeadContext,
  ): Promise<CreateLeadResult>;
  now?: () => Date;
  logger?: LeadLogger;
  trustedProxyHops?: number;
}

interface LeadLogger {
  error(diagnostic: LeadFailureDiagnostic): void;
}

interface LeadFailureDiagnostic {
  event: "lead_create_failed";
  errorClass: "LeadDomainError" | "Error" | "UnknownError";
  code: "PERSISTENCE";
  category: "persistence";
}

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export function createLeadHandler({
  createLead,
  now = () => new Date(),
  logger = console,
  trustedProxyHops = 1,
}: LeadHandlerDependencies): (request: Request) => Promise<Response> {
  return async function handleCreateLead(request: Request): Promise<Response> {
    let input: unknown;

    try {
      input = await request.json();
    } catch {
      return validationResponse({ _form: ["Некорректный JSON"] });
    }

    try {
      const data = await createLead(input, {
        clientIp: extractTrustedClientIp(request.headers, trustedProxyHops),
        now: now(),
      });
      const body = LeadSuccessResponseSchema.parse({ ok: true, data });

      return Response.json(body, {
        status: 201,
        headers: NO_STORE_HEADERS,
      });
    } catch (error) {
      if (error instanceof LeadDomainError) {
        if (error.code === "VALIDATION") {
          return validationResponse(error.fields ?? {
            _form: ["Проверьте заполненные поля"],
          });
        }

        if (error.code === "RATE_LIMITED") {
          const retryAfterSeconds = error.retryAfterSeconds ?? 1;
          const body = LeadRateLimitErrorResponseSchema.parse({
            ok: false,
            error: {
              code: "RATE_LIMITED",
              message: "Слишком много заявок. Попробуйте позже.",
              retryAfterSeconds,
            },
          });

          return Response.json(body, {
            status: 429,
            headers: {
              ...NO_STORE_HEADERS,
              "Retry-After": String(retryAfterSeconds),
            },
          });
        }
      }

      logger.error({
        event: "lead_create_failed",
        errorClass:
          error instanceof LeadDomainError
            ? "LeadDomainError"
            : error instanceof Error
              ? "Error"
              : "UnknownError",
        code: "PERSISTENCE",
        category: "persistence",
      });
      const body = LeadPersistenceErrorResponseSchema.parse({
        ok: false,
        error: {
          code: "PERSISTENCE",
          message: "Не удалось отправить заявку. Попробуйте ещё раз позже.",
        },
      });

      return Response.json(body, {
        status: 500,
        headers: NO_STORE_HEADERS,
      });
    }
  };
}

function validationResponse(fields: Record<string, string[]>): Response {
  const body = LeadValidationErrorResponseSchema.parse({
    ok: false,
    error: {
      code: "VALIDATION",
      message: "Проверьте заполненные поля.",
      fields,
    },
  });

  return Response.json(body, {
    status: 422,
    headers: NO_STORE_HEADERS,
  });
}

async function createLeadFromDatabase(
  input: unknown,
  context: CreateLeadContext,
): Promise<CreateLeadResult> {
  const [
    { getServerEnv },
    { createLeadService },
    { DrizzleLeadRepository },
    { DrizzleRateLimitRepository },
    { notifyLeadTelegram },
  ] = await Promise.all([
    import("@/lib/env/server"),
    import("@/modules/leads/create-lead.service"),
    import("@/modules/leads/lead.repository"),
    import("@/modules/leads/rate-limit.repository"),
    import("@/modules/leads/telegram-notify"),
  ]);
  const service = createLeadService({
    leadRepository: new DrizzleLeadRepository(),
    rateLimitRepository: new DrizzleRateLimitRepository(),
    sessionSecret: getServerEnv().SESSION_SECRET,
    notifyLead: notifyLeadTelegram,
  });

  return service.create(input, context);
}

export async function POST(request: Request): Promise<Response> {
  const { getServerEnv } = await import("@/lib/env/server");
  const handler = createLeadHandler({
    createLead: createLeadFromDatabase,
    trustedProxyHops: getServerEnv().TRUSTED_PROXY_HOPS,
  });

  return handler(request);
}
