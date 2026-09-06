import { describe, expect, it } from "vitest";

import {
  AdminLeadsDomainError,
  createAdminLeadsService,
  type AdminLeadRecord,
  type AdminLeadsRepository,
} from "./admin-leads.service";

describe("admin leads CSV", () => {
  it("exports UTF-8 BOM CSV with required columns", async () => {
    const rows: AdminLeadRecord[] = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Алексей",
        phone: "+79991234567",
        situation: "Нужна консультация, срочно",
        serviceName: "Развод",
        status: "NEW",
        isDataAgreed: true,
        isMarketingAgreed: true,
        consentAt: new Date("2026-07-12T10:00:00.000Z"),
        createdAt: new Date("2026-07-12T10:00:00.000Z"),
        updatedAt: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];
    const repository: AdminLeadsRepository = {
      listPage: async () => rows,
      updateStatus: async () => rows[0]!,
    };
    const service = createAdminLeadsService(repository);
    const csv = service.toCsv((await service.listPage({})).items);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(
      "date,name,phone,service,situation,status,data_agreed,marketing_agreed,consent_at",
    );
    expect(csv).toContain("Алексей");
    expect(csv).toContain("+79991234567");
    expect(csv).toContain('"Нужна консультация, срочно"');
  });

  it("neutralizes CSV formula injection", async () => {
    const rows: AdminLeadRecord[] = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Алексей",
        phone: "+79991234567",
        situation: "=HYPERLINK(\"http://evil.test\")",
        serviceName: null,
        status: "NEW",
        isDataAgreed: true,
        isMarketingAgreed: false,
        consentAt: new Date("2026-07-12T10:00:00.000Z"),
        createdAt: new Date("2026-07-12T10:00:00.000Z"),
        updatedAt: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];
    const csv = createAdminLeadsService({
      listPage: async () => rows,
      updateStatus: async () => rows[0]!,
    }).toCsv(rows);

    expect(csv).toContain("\"'=HYPERLINK(\"\"http://evil.test\"\")\"");
    expect(csv).not.toMatch(/(?:^|,)=HYPERLINK/m);
  });
});

describe("admin leads list filter", () => {
  const sample: AdminLeadRecord = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Алексей",
    phone: "+79991234567",
    situation: null,
    serviceName: null,
    status: "CLOSED",
    isDataAgreed: true,
    isMarketingAgreed: false,
    consentAt: new Date("2026-07-12T10:00:00.000Z"),
    createdAt: new Date("2026-07-12T10:00:00.000Z"),
    updatedAt: new Date("2026-07-12T10:00:00.000Z"),
  };

  it("passes status to the repository", async () => {
    let received: unknown;
    const service = createAdminLeadsService({
      listPage: async (input) => {
        received = input;
        return [sample];
      },
      updateStatus: async () => sample,
    });

    await service.listPage({ status: "CLOSED" });

    expect(received).toMatchObject({ status: "CLOSED" });
  });

  it("rejects an invalid status", async () => {
    const service = createAdminLeadsService({
      listPage: async () => [sample],
      updateStatus: async () => sample,
    });

    await expect(service.listPage({ status: "NOPE" })).rejects.toBeInstanceOf(
      AdminLeadsDomainError,
    );
    await expect(service.listPage({ status: "NOPE" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});
