import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createLeadService, LeadDomainError } from "./create-lead.service";
import type { LeadRepository } from "./lead.repository";
import { normalizeRussianPhone } from "./phone";
import type { RateLimitRepository } from "./rate-limit.repository";

const NOW = new Date("2026-07-12T10:07:30.000Z");
const SESSION_SECRET = "s".repeat(32);

function validLeadInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Алексей",
    phone: "9991234567",
    isDataAgreed: true as const,
    isMarketingAgreed: false,
    ...overrides,
  };
}

function createRepositories() {
  const rateLimitCalls: Parameters<RateLimitRepository["increment"]>[0][] = [];
  const leadCalls: Parameters<LeadRepository["create"]>[0][] = [];
  let count = 0;

  const rateLimitRepository: RateLimitRepository = {
    increment: async (input) => {
      rateLimitCalls.push(input);
      count += 1;
      return count;
    },
    deleteOlderThan: async () => undefined,
  };
  const leadRepository: LeadRepository = {
    create: async (input) => {
      leadCalls.push(input);
      return "11111111-1111-4111-8111-111111111111";
    },
  };

  return {
    rateLimitRepository,
    leadRepository,
    rateLimitCalls,
    leadCalls,
  };
}

describe("normalizeRussianPhone", () => {
  it.each([
    ["8 (999) 123-45-67", "+79991234567"],
    ["+7 999 123 45 67", "+79991234567"],
    ["9991234567", "+79991234567"],
    ["+7 495 123-45-67", "+74951234567"],
    ["+7 812 123-45-67", "+78121234567"],
    ["+7 800 123-45-67", "+78001234567"],
    ["8 495 123-45-67", "+74951234567"],
    ["4951234567", "+74951234567"],
    ["3481234567", "+73481234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeRussianPhone(input)).toBe(expected);
  });

  it.each([
    "",
    "+1 999 123 45 67",
    "+8 999 123 45 67",
    "+44 20 7946 0958",
    "7 899 123 45 67",
    "899123456",
    "2991234567",
    "5991234567",
    "6991234567",
    "7991234567",
    "9999999999",
    "+7 (999) abc-45-67",
  ])("rejects invalid phone %j", (input) => {
    expect(() => normalizeRussianPhone(input)).toThrow();
  });
});

describe("createLeadService", () => {
  it("passes normalized values and dynamic service name to lead repository", async () => {
    const repositories = createRepositories();
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
    });

    const result = await service.create(
      {
        name: "  Алексей Сысуев  ",
        phone: "8 (999) 123-45-67",
        situation: "  Нужна консультация  ",
        service: "  Раздел имущества  ",
        website: "",
        isDataAgreed: true,
        isMarketingAgreed: true,
      },
      { clientIp: "203.0.113.42", now: NOW },
    );

    expect(result).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
    expect(repositories.leadCalls).toEqual([
      {
        name: "Алексей Сысуев",
        phone: "+79991234567",
        situation: "Нужна консультация",
        serviceName: "Раздел имущества",
        isDataAgreed: true,
        isMarketingAgreed: true,
        consentAt: NOW,
        consentDocumentVersion: "2026-08-19",
        consentCheckboxText:
          "Даю согласие на обработку персональных данных согласно Согласию на обработку персональных данных (ред. от 19.08.2026) и Политике конфиденциальности.",
      },
    ]);
    expect(repositories.rateLimitCalls).toHaveLength(1);
    expect(repositories.rateLimitCalls[0]).toMatchObject({
      action: "lead:create",
      windowStart: new Date("2026-07-12T10:00:00.000Z"),
    });
    expect(repositories.rateLimitCalls[0]?.hashedKey).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(repositories.rateLimitCalls)).not.toContain(
      "203.0.113.42",
    );
  });

  it("accepts five valid submissions and rate-limits the sixth", async () => {
    const repositories = createRepositories();
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
    });
    const input = validLeadInput();
    const context = { clientIp: "203.0.113.42", now: NOW };

    await Promise.all(
      Array.from({ length: 5 }, () => service.create(input, context)),
    );

    await expect(service.create(input, context)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryAfterSeconds: 450,
    });
    expect(repositories.leadCalls).toHaveLength(5);
  });

  it("rejects strict invalid payload before touching repositories", async () => {
    const repositories = createRepositories();
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
    });

    await expect(
      service.create(
        {
          name: "A",
          phone: "9991234567",
          unknown: "field",
        },
        { clientIp: "unknown", now: NOW },
      ),
    ).rejects.toBeInstanceOf(LeadDomainError);
    expect(repositories.rateLimitCalls).toHaveLength(0);
    expect(repositories.leadCalls).toHaveLength(0);
  });

  it.each([
    ["name", validLeadInput({ name: "A" })],
    ["phone", validLeadInput({ phone: "+1 202 555 0100" })],
    ["situation", validLeadInput({ situation: "x".repeat(2_001) })],
    ["service", validLeadInput({ service: "x".repeat(121) })],
    ["isDataAgreed", validLeadInput({ isDataAgreed: false })],
  ])("maps invalid %s to its public field", async (field, input) => {
    const repositories = createRepositories();
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
    });

    await expect(
      service.create(input, { clientIp: "unknown", now: NOW }),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      fields: { [field]: expect.any(Array) },
    });
  });

  it("maps a filled honeypot to a generic form error without bot hints", async () => {
    const repositories = createRepositories();
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
    });

    const error: unknown = await service
      .create(
        {
          name: "Алексей",
          phone: "9991234567",
          website: "https://spam.example",
          isDataAgreed: true,
          isMarketingAgreed: true,
        },
        { clientIp: "203.0.113.42", now: NOW },
      )
      .catch((reason: unknown) => reason);

    expect(error).toMatchObject({
      code: "VALIDATION",
      fields: { _form: ["Проверьте заполненные поля"] },
    });
    expect(JSON.stringify(error)).not.toMatch(/website|bot|spam/i);
    expect(repositories.rateLimitCalls).toHaveLength(0);
    expect(repositories.leadCalls).toHaveLength(0);
  });

  it("preserves a lead repository Error as persistence cause", async () => {
    const repositories = createRepositories();
    const repositoryError = new Error(
      'INSERT failed for phone="+79991234567"',
    );
    const service = createLeadService({
      ...repositories,
      leadRepository: {
        create: async () => {
          throw repositoryError;
        },
      },
      sessionSecret: SESSION_SECRET,
    });

    await expect(
      service.create(
        { name: "Алексей", phone: "9991234567", isDataAgreed: true, isMarketingAgreed: true },
        { clientIp: "203.0.113.42", now: NOW },
      ),
    ).rejects.toMatchObject({
      code: "PERSISTENCE",
      cause: repositoryError,
    });
  });

  it("calls notifyLead after successful repository create", async () => {
    const repositories = createRepositories();
    const notifyLead = vi.fn().mockResolvedValue(undefined);
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
      notifyLead,
    });

    const result = await service.create(
      validLeadInput({
        situation: "Нужна консультация",
        service: "Раздел имущества",
      }),
      { clientIp: "203.0.113.42", now: NOW },
    );

    expect(result).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
    expect(repositories.leadCalls).toHaveLength(1);
    expect(notifyLead).toHaveBeenCalledOnce();
    expect(notifyLead).toHaveBeenCalledWith({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Алексей",
      phone: "+79991234567",
      situation: "Нужна консультация",
      serviceName: "Раздел имущества",
    });
  });

  it("returns lead id when notifyLead rejects", async () => {
    const repositories = createRepositories();
    const notifyLead = vi.fn().mockRejectedValue(new Error("telegram down"));
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
      notifyLead,
    });

    const result = await service.create(validLeadInput(), {
      clientIp: "203.0.113.42",
      now: NOW,
    });

    expect(result).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
    expect(notifyLead).toHaveBeenCalledOnce();
  });

  it("does not call notifyLead when repository create fails", async () => {
    const repositories = createRepositories();
    const notifyLead = vi.fn().mockResolvedValue(undefined);
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
      notifyLead,
      leadRepository: {
        create: async () => {
          throw new Error("insert failed");
        },
      },
    });

    await expect(
      service.create(validLeadInput(), {
        clientIp: "203.0.113.42",
        now: NOW,
      }),
    ).rejects.toMatchObject({ code: "PERSISTENCE" });
    expect(notifyLead).not.toHaveBeenCalled();
  });

  it("preserves a rate-limit repository Error as persistence cause", async () => {
    const repositories = createRepositories();
    const repositoryError = new Error("rate_limits SQL failed");
    const service = createLeadService({
      ...repositories,
      rateLimitRepository: {
        increment: async () => {
          throw repositoryError;
        },
        deleteOlderThan: async () => undefined,
      },
      sessionSecret: SESSION_SECRET,
    });

    await expect(
      service.create(
        { name: "Алексей", phone: "9991234567", isDataAgreed: true, isMarketingAgreed: true },
        { clientIp: "203.0.113.42", now: NOW },
      ),
    ).rejects.toMatchObject({
      code: "PERSISTENCE",
      cause: repositoryError,
    });
  });
});
