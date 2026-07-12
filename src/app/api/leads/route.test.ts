import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  LeadErrorResponseSchema,
  LeadSuccessResponseSchema,
} from "@/modules/leads/lead.schemas";
import { LeadDomainError } from "@/modules/leads/create-lead.service";

import { createLeadHandler } from "./route";

const ID = "11111111-1111-4111-8111-111111111111";

function request(body: string, headers?: HeadersInit): Request {
  return new Request("https://example.test/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("POST /api/leads", () => {
  it("returns 201 and prefers the trusted forwarded chain", async () => {
    const createLead = vi.fn().mockResolvedValue({ id: ID });
    const now = new Date("2026-07-12T10:07:30.000Z");
    const handler = createLeadHandler({ createLead, now: () => now });

    const response = await handler(
      request(JSON.stringify({ name: "Алексей", phone: "9991234567" }), {
        "x-real-ip": "203.0.113.42",
        "x-forwarded-for": "198.51.100.1, 198.51.100.2",
      }),
    );
    const body = LeadSuccessResponseSchema.parse(await response.json());

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ ok: true, data: { id: ID } });
    expect(createLead).toHaveBeenCalledWith(
      { name: "Алексей", phone: "9991234567" },
      { clientIp: "198.51.100.2", now },
    );
  });

  it("returns 422 field errors for invalid payload", async () => {
    const handler = createLeadHandler({
      createLead: async () => {
        throw new LeadDomainError("VALIDATION", {
          name: ["Введите не менее 2 символов"],
        });
      },
    });

    const response = await handler(
      request(JSON.stringify({ name: "A", phone: "bad" })),
    );
    const body = LeadErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(422);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Проверьте заполненные поля.",
        fields: { name: ["Введите не менее 2 символов"] },
      },
    });
  });

  it("returns 422 for malformed JSON without invoking service", async () => {
    const createLead = vi.fn();
    const handler = createLeadHandler({ createLead });

    const response = await handler(request("{"));
    const body = LeadErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION");
    expect(createLead).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After", async () => {
    const handler = createLeadHandler({
      createLead: async () => {
        throw new LeadDomainError("RATE_LIMITED", undefined, 450);
      },
    });

    const response = await handler(
      request(JSON.stringify({ name: "Алексей", phone: "9991234567" })),
    );
    const body = LeadErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("450");
    expect(body.error).toEqual({
      code: "RATE_LIMITED",
      message: "Слишком много заявок. Попробуйте позже.",
      retryAfterSeconds: 450,
    });
  });

  it("returns safe 500 and logs only a stable diagnostic", async () => {
    const logger = { error: vi.fn() };
    const repositoryError = new Error(
      'INSERT INTO leads phone="+79991234567"; secret=raw-db-error',
    );
    const handler = createLeadHandler({
      createLead: async () => {
        throw new LeadDomainError(
          "PERSISTENCE",
          undefined,
          undefined,
          repositoryError,
        );
      },
      logger,
    });

    const response = await handler(
      request(
        JSON.stringify({
          name: "Алексей",
          phone: "9991234567",
          situation: "Секретная ситуация",
        }),
      ),
    );
    const body = LeadErrorResponseSchema.parse(await response.json());
    const serialized = JSON.stringify({ body, calls: logger.error.mock.calls });

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "PERSISTENCE",
      message: "Не удалось отправить заявку. Попробуйте ещё раз позже.",
    });
    expect(logger.error).toHaveBeenCalledWith({
      event: "lead_create_failed",
      errorClass: "LeadDomainError",
      code: "PERSISTENCE",
      category: "persistence",
    });
    expect(serialized).not.toMatch(
      /Алексей|79991234567|Секретная|INSERT|raw-db-error/i,
    );
  });

  it("uses configured trusted hop and stable unknown fallback", async () => {
    const createLead = vi.fn().mockResolvedValue({ id: ID });
    const trustedHandler = createLeadHandler({
      createLead,
      trustedProxyHops: 2,
    });
    const unknownHandler = createLeadHandler({ createLead });
    const payload = JSON.stringify({ name: "Алексей", phone: "9991234567" });

    await trustedHandler(
      request(payload, {
        "x-forwarded-for": " 203.0.113.9, 198.51.100.1, 198.51.100.2 ",
      }),
    );
    await unknownHandler(request(payload));

    expect(createLead.mock.calls[0]?.[1].clientIp).toBe("198.51.100.1");
    expect(createLead.mock.calls[1]?.[1].clientIp).toBe("unknown");
  });
});
