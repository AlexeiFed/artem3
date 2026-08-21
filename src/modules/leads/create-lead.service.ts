import "server-only";

import { createHmac } from "node:crypto";
import { z } from "zod";

import {
  CreateLeadInputSchema,
  type LeadFieldErrors,
} from "./lead.schemas";
import type { LeadRepository } from "./lead.repository";
import {
  PERSONAL_DATA_CONSENT_CHECKBOX_TEXT,
  PERSONAL_DATA_CONSENT_VERSION,
} from "./personal-data-consent";
import { InvalidRussianPhoneError, normalizeRussianPhone } from "./phone";
import type { RateLimitRepository } from "./rate-limit.repository";

const RATE_LIMIT_ACTION = "lead:create";
const RATE_LIMIT_MAXIMUM = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;

export type LeadErrorCode = "VALIDATION" | "RATE_LIMITED" | "PERSISTENCE";

export class LeadDomainError extends Error {
  readonly fields: LeadFieldErrors | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    readonly code: LeadErrorCode,
    fields?: LeadFieldErrors,
    retryAfterSeconds?: number,
    cause?: Error,
  ) {
    super(code, cause ? { cause } : undefined);
    this.name = "LeadDomainError";
    this.fields = fields;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface CreateLeadContext {
  clientIp: string;
  now: Date;
}

export interface CreateLeadResult {
  id: string;
}

export interface NotifyLeadPayload {
  id: string;
  name: string;
  phone: string;
  situation?: string | undefined;
  serviceName?: string | undefined;
}

interface CreateLeadServiceDependencies {
  leadRepository: LeadRepository;
  rateLimitRepository: RateLimitRepository;
  sessionSecret: string;
  notifyLead?: (payload: NotifyLeadPayload) => Promise<void>;
}

export interface CreateLeadService {
  create(input: unknown, context: CreateLeadContext): Promise<CreateLeadResult>;
}

export function createLeadService({
  leadRepository,
  rateLimitRepository,
  sessionSecret,
  notifyLead,
}: CreateLeadServiceDependencies): CreateLeadService {
  return {
    async create(
      input: unknown,
      context: CreateLeadContext,
    ): Promise<CreateLeadResult> {
      if (hasFilledHoneypot(input)) {
        throw new LeadDomainError("VALIDATION", {
          _form: ["Проверьте заполненные поля"],
        });
      }

      const parsed = CreateLeadInputSchema.safeParse(input);
      if (!parsed.success) {
        throw validationError(parsed.error);
      }

      let phone: string;
      try {
        phone = normalizeRussianPhone(parsed.data.phone);
      } catch (error) {
        if (error instanceof InvalidRussianPhoneError) {
          throw new LeadDomainError("VALIDATION", {
            phone: ["Введите корректный российский номер"],
          });
        }
        throw error;
      }

      const windowStart = new Date(
        Math.floor(context.now.getTime() / RATE_LIMIT_WINDOW_MS) *
          RATE_LIMIT_WINDOW_MS,
      );
      const hashedKey = createHmac("sha256", sessionSecret)
        .update(context.clientIp)
        .digest("hex");

      let count: number;
      try {
        count = await rateLimitRepository.increment({
          hashedKey,
          action: RATE_LIMIT_ACTION,
          windowStart,
        });
      } catch (error) {
        throw new LeadDomainError(
          "PERSISTENCE",
          undefined,
          undefined,
          asErrorCause(error),
        );
      }

      if (count > RATE_LIMIT_MAXIMUM) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(
            (windowStart.getTime() +
              RATE_LIMIT_WINDOW_MS -
              context.now.getTime()) /
              1_000,
          ),
        );
        throw new LeadDomainError(
          "RATE_LIMITED",
          undefined,
          retryAfterSeconds,
        );
      }

      try {
        const id = await leadRepository.create({
          name: parsed.data.name,
          phone,
          isDataAgreed: parsed.data.isDataAgreed,
          isMarketingAgreed: parsed.data.isMarketingAgreed,
          consentAt: context.now,
          consentDocumentVersion: PERSONAL_DATA_CONSENT_VERSION,
          consentCheckboxText: PERSONAL_DATA_CONSENT_CHECKBOX_TEXT,
          ...(parsed.data.situation === undefined
            ? {}
            : { situation: parsed.data.situation }),
          ...(parsed.data.service === undefined
            ? {}
            : { serviceName: parsed.data.service }),
        });

        if (notifyLead) {
          try {
            await notifyLead({
              id,
              name: parsed.data.name,
              phone,
              ...(parsed.data.situation === undefined
                ? {}
                : { situation: parsed.data.situation }),
              ...(parsed.data.service === undefined
                ? {}
                : { serviceName: parsed.data.service }),
            });
          } catch (error) {
            console.error({
              event: "lead_notify_failed",
              category: "external",
              leadId: id,
              errorClass:
                error instanceof Error ? error.name : "UnknownError",
            });
          }
        }

        return { id };
      } catch (error) {
        throw new LeadDomainError(
          "PERSISTENCE",
          undefined,
          undefined,
          asErrorCause(error),
        );
      }
    },
  };
}

function hasFilledHoneypot(input: unknown): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    "website" in input &&
    typeof input.website === "string" &&
    input.website.length > 0
  );
}

function validationError(error: z.ZodError): LeadDomainError {
  const fields: LeadFieldErrors = {};

  for (const issue of error.issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "_form";
    (fields[field] ??= []).push(issue.message);
  }

  return new LeadDomainError("VALIDATION", fields);
}

function asErrorCause(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("Non-Error persistence failure");
}
