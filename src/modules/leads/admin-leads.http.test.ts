import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/modules/audit/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import {
  createExportLeadsHandler,
  createListLeadsHandler,
} from "./admin-leads.http";
import type { AdminLeadRecord } from "./admin-leads.service";

const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.com",
};

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

describe("admin leads HTTP status filter", () => {
  it("forwards status from the list query string", async () => {
    const listPage = vi.fn().mockResolvedValue({ items: [sample], nextCursor: null });
    const handler = createListLeadsHandler({
      requireAdmin: async () => USER,
      service: { listPage },
    });

    await handler(
      new Request("https://example.test/api/admin/leads?status=CLOSED"),
    );

    expect(listPage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CLOSED" }),
    );
  });

  it("does not forward an empty status", async () => {
    const listPage = vi.fn().mockResolvedValue({ items: [], nextCursor: null });
    const handler = createListLeadsHandler({
      requireAdmin: async () => USER,
      service: { listPage },
    });

    await handler(new Request("https://example.test/api/admin/leads?status="));

    expect(listPage).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() }),
    );
  });

  it("forwards status to every export page", async () => {
    const listPage = vi.fn().mockResolvedValue({ items: [sample], nextCursor: null });
    const handler = createExportLeadsHandler({
      requireAdmin: async () => USER,
      service: {
        listPage,
        updateStatus: async () => sample,
        toCsv: () => "csv",
      },
    });

    await handler(
      new Request("https://example.test/api/admin/leads/export?status=CLOSED"),
    );

    expect(listPage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CLOSED" }),
    );
  });
});
