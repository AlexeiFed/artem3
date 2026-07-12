import { describe, expect, it } from "vitest";

import {
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
        createdAt: new Date("2026-07-12T10:00:00.000Z"),
        updatedAt: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];
    const repository: AdminLeadsRepository = {
      list: async () => rows,
      updateStatus: async () => rows[0]!,
    };
    const service = createAdminLeadsService(repository);
    const csv = service.toCsv(await service.list());

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("date,name,phone,service,situation,status");
    expect(csv).toContain("Алексей");
    expect(csv).toContain("+79991234567");
    expect(csv).toContain('"Нужна консультация, срочно"');
  });
});
