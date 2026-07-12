import { describe, expect, it, vi } from "vitest";

import {
  AdminContentDomainError,
  createAdminContentService,
  type AdminContentRepository,
  type ReorderableEntity,
} from "./admin-content.service";

const CASE_A = "20000000-0000-4000-8000-000000000001";
const CASE_B = "20000000-0000-4000-8000-000000000002";
const CASE_C = "20000000-0000-4000-8000-000000000003";
const CASE_D = "20000000-0000-4000-8000-000000000004";

function createMemoryRepository(
  initialOrder: string[] = [CASE_A, CASE_B, CASE_C, CASE_D],
): AdminContentRepository & { committedOrder: string[] } {
  let order = [...initialOrder];
  const repository: AdminContentRepository & { committedOrder: string[] } = {
    get committedOrder() {
      return [...order];
    },
    async reorder(entity: ReorderableEntity, orderedIds: string[]) {
      if (entity !== "cases") {
        throw new Error(`Unexpected entity ${entity}`);
      }
      const current = new Set(order);
      const next = new Set(orderedIds);
      if (
        orderedIds.length !== order.length ||
        orderedIds.some((id) => !current.has(id)) ||
        [...current].some((id) => !next.has(id))
      ) {
        throw new AdminContentDomainError("CONFLICT", {
          ids: ["Набор ID должен совпадать с существующими записями"],
        });
      }
      order = [...orderedIds];
      return orderedIds;
    },
    async updateSiteSettings() {
      throw new Error("not implemented in this fixture");
    },
    async updateService() {
      throw new Error("not implemented in this fixture");
    },
    async createCase() {
      throw new Error("not implemented in this fixture");
    },
    async updateCase() {
      throw new Error("not implemented in this fixture");
    },
    async deleteCase() {
      throw new Error("not implemented in this fixture");
    },
    async createFaq() {
      throw new Error("not implemented in this fixture");
    },
    async updateFaq() {
      throw new Error("not implemented in this fixture");
    },
    async deleteFaq() {
      throw new Error("not implemented in this fixture");
    },
    async createReview() {
      throw new Error("not implemented in this fixture");
    },
    async updateReview() {
      throw new Error("not implemented in this fixture");
    },
    async deleteReview() {
      throw new Error("not implemented in this fixture");
    },
    async createCertificate() {
      throw new Error("not implemented in this fixture");
    },
    async updateCertificate() {
      throw new Error("not implemented in this fixture");
    },
    async deleteCertificate() {
      throw new Error("not implemented in this fixture");
    },
  };
  return repository;
}

describe("admin content service", () => {
  it("reorders all case rows in one transaction", async () => {
    const repository = createMemoryRepository();
    const revalidateLandingData = vi.fn();
    const service = createAdminContentService({
      repository,
      revalidateLandingData,
    });

    const result = await service.reorder("cases", [CASE_C, CASE_A, CASE_B, CASE_D]);

    expect(result).toEqual([CASE_C, CASE_A, CASE_B, CASE_D]);
    expect(repository.committedOrder).toEqual([
      CASE_C,
      CASE_A,
      CASE_B,
      CASE_D,
    ]);
    expect(revalidateLandingData).toHaveBeenCalledOnce();
  });

  it("rejects reorder when the ID set does not match", async () => {
    const repository = createMemoryRepository();
    const service = createAdminContentService({
      repository,
      revalidateLandingData: vi.fn(),
    });

    await expect(
      service.reorder("cases", [CASE_C, CASE_A, CASE_B]),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(repository.committedOrder).toEqual([
      CASE_A,
      CASE_B,
      CASE_C,
      CASE_D,
    ]);
  });

  it("rejects unknown reorder entity types", async () => {
    const service = createAdminContentService({
      repository: createMemoryRepository(),
      revalidateLandingData: vi.fn(),
    });

    await expect(
      service.reorder("leads" as ReorderableEntity, [CASE_A]),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
