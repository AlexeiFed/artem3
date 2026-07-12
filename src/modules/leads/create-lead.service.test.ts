import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createLeadService, LeadDomainError } from "./create-lead.service";
import type { LeadRepository } from "./lead.repository";
import { normalizeRussianPhone } from "./phone";
import type { RateLimitRepository } from "./rate-limit.repository";

const NOW = new Date("2026-07-12T10:07:30.000Z");
const SESSION_SECRET = "s".repeat(32);

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
  ])("normalizes %s", (input, expected) => {
    expect(normalizeRussianPhone(input)).toBe(expected);
  });

  it.each([
    "",
    "+1 999 123 45 67",
    "7 899 123 45 67",
    "899123456",
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
    const input = { name: "Алексей", phone: "9991234567" };
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

  it("silently accepts honeypot without creating or rate-limiting a lead", async () => {
    const repositories = createRepositories();
    const service = createLeadService({
      ...repositories,
      sessionSecret: SESSION_SECRET,
    });

    const result = await service.create(
      {
        name: "Алексей",
        phone: "9991234567",
        website: "https://spam.example",
      },
      { clientIp: "203.0.113.42", now: NOW },
    );

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(repositories.rateLimitCalls).toHaveLength(0);
    expect(repositories.leadCalls).toHaveLength(0);
  });
});
