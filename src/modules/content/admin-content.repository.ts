import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  cases,
  certificates,
  faqs,
  reviews,
  services,
  siteSettings,
} from "@/db/schema";

import type { UpdateSiteSettingsInput } from "./admin-content.schemas";
import {
  AdminContentDomainError,
  type AdminContentRepository,
  type PersistedCase,
  type PersistedCertificate,
  type PersistedFaq,
  type PersistedReview,
  type PersistedService,
  type ReorderableEntity,
} from "./admin-content.service";
import { PersistedServiceSchema } from "./content.schemas";
import type {
  CaseContent,
  CertificateContent,
  FaqContent,
  ReviewContent,
  ServiceContent,
} from "./content.types";
import type { SiteSettingsRow } from "./content.repository";

type Database = ReturnType<typeof getDb>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const ENTITY_LIMITS = {
  cases: { min: 1, max: 12 },
  faqs: { min: 6, max: 20 },
  reviews: { min: 3, max: 6 },
  certificates: { min: 1, max: 4 },
  services: { min: 1, max: 12 },
} as const;

export class DrizzleAdminContentRepository implements AdminContentRepository {
  constructor(private readonly db: Database = getDb()) {}

  async updateSiteSettings(
    input: UpdateSiteSettingsInput,
  ): Promise<SiteSettingsRow> {
    const [updated] = await this.db
      .update(siteSettings)
      .set({
        ...(input.hero === undefined ? {} : { hero: input.hero }),
        ...(input.trustBanner === undefined
          ? {}
          : { trustBanner: input.trustBanner }),
        ...(input.workflow === undefined ? {} : { workflow: input.workflow }),
        ...(input.contacts === undefined ? {} : { contacts: input.contacts }),
        ...(input.legal === undefined ? {} : { legal: input.legal }),
        ...(input.map === undefined ? {} : { map: input.map }),
        ...(input.ratings === undefined ? {} : { ratings: input.ratings }),
        ...(input.vkEmbed === undefined ? {} : { vkEmbed: input.vkEmbed }),
        ...(input.analytics === undefined
          ? {}
          : { analytics: input.analytics }),
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, "default"))
      .returning();

    if (!updated) {
      throw new AdminContentDomainError("NOT_FOUND", {
        id: ["Настройки сайта не найдены"],
      });
    }

    return updated;
  }

  async updateService(
    id: string,
    input: ServiceContent,
  ): Promise<PersistedService> {
    const [updated] = await this.db
      .update(services)
      .set({
        slug: input.slug,
        title: input.title,
        description: input.description,
        situations: input.situations,
        trustNote: input.trustNote,
        priceFromKopecks: input.priceFromKopecks,
        isHighValue: input.isHighValue,
        isHidden: input.isHidden,
        ctaLabel: input.ctaLabel,
        iconUrl: input.iconUrl,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (!updated) {
      throw new AdminContentDomainError("NOT_FOUND", {
        id: ["Услуга не найдена"],
      });
    }

    return PersistedServiceSchema.parse(updated);
  }

  async createService(input: ServiceContent): Promise<PersistedService> {
    return this.db.transaction(async (tx) => {
      await this.assertCanCreate(tx, "services");
      const sortOrder = await this.nextSortOrder(tx, services);
      const [created] = await tx
        .insert(services)
        .values({
          slug: input.slug,
          title: input.title,
          description: input.description,
          situations: input.situations,
          trustNote: input.trustNote,
          priceFromKopecks: input.priceFromKopecks,
          isHighValue: input.isHighValue,
          isHidden: input.isHidden,
          ctaLabel: input.ctaLabel,
          iconUrl: input.iconUrl,
          sortOrder,
        })
        .returning();
      if (!created) {
        throw new AdminContentDomainError("PERSISTENCE");
      }
      return PersistedServiceSchema.parse(created);
    });
  }

  async deleteService(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.assertCanDelete(tx, "services");
      const deleted = await tx
        .delete(services)
        .where(eq(services.id, id))
        .returning({ id: services.id });
      if (deleted.length === 0) {
        throw new AdminContentDomainError("NOT_FOUND", {
          id: ["Услуга не найдена"],
        });
      }
      await this.compactSortOrders(tx, "services");
    });
  }

  async createCase(input: CaseContent): Promise<PersistedCase> {
    return this.db.transaction(async (tx) => {
      await this.assertCanCreate(tx, "cases");
      const sortOrder = await this.nextSortOrder(tx, cases);
      const [created] = await tx
        .insert(cases)
        .values({
          situation: input.situation,
          action: input.action,
          result: input.result,
          sortOrder,
        })
        .returning();
      if (!created) {
        throw new AdminContentDomainError("PERSISTENCE");
      }
      return created;
    });
  }

  async updateCase(id: string, input: CaseContent): Promise<PersistedCase> {
    const [updated] = await this.db
      .update(cases)
      .set({
        situation: input.situation,
        action: input.action,
        result: input.result,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, id))
      .returning();

    if (!updated) {
      throw new AdminContentDomainError("NOT_FOUND", {
        id: ["Кейс не найден"],
      });
    }

    return updated;
  }

  async deleteCase(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.assertCanDelete(tx, "cases");
      const deleted = await tx
        .delete(cases)
        .where(eq(cases.id, id))
        .returning({ id: cases.id });
      if (deleted.length === 0) {
        throw new AdminContentDomainError("NOT_FOUND", {
          id: ["Кейс не найден"],
        });
      }
      await this.compactSortOrders(tx, "cases");
    });
  }

  async createFaq(input: FaqContent): Promise<PersistedFaq> {
    return this.db.transaction(async (tx) => {
      await this.assertCanCreate(tx, "faqs");
      const sortOrder = await this.nextSortOrder(tx, faqs);
      const [created] = await tx
        .insert(faqs)
        .values({
          question: input.question,
          answer: input.answer,
          sortOrder,
        })
        .returning();
      if (!created) {
        throw new AdminContentDomainError("PERSISTENCE");
      }
      return created;
    });
  }

  async updateFaq(id: string, input: FaqContent): Promise<PersistedFaq> {
    const [updated] = await this.db
      .update(faqs)
      .set({
        question: input.question,
        answer: input.answer,
        updatedAt: new Date(),
      })
      .where(eq(faqs.id, id))
      .returning();

    if (!updated) {
      throw new AdminContentDomainError("NOT_FOUND", {
        id: ["FAQ не найден"],
      });
    }

    return updated;
  }

  async deleteFaq(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.assertCanDelete(tx, "faqs");
      const deleted = await tx
        .delete(faqs)
        .where(eq(faqs.id, id))
        .returning({ id: faqs.id });
      if (deleted.length === 0) {
        throw new AdminContentDomainError("NOT_FOUND", {
          id: ["FAQ не найден"],
        });
      }
      await this.compactSortOrders(tx, "faqs");
    });
  }

  async createReview(input: ReviewContent): Promise<PersistedReview> {
    return this.db.transaction(async (tx) => {
      await this.assertCanCreate(tx, "reviews");
      const sortOrder = await this.nextSortOrder(tx, reviews);
      const [created] = await tx
        .insert(reviews)
        .values({
          author: input.author,
          quote: input.quote,
          imageUrl: input.imageUrl,
          source: input.source,
          sourceUrl: input.sourceUrl,
          sortOrder,
        })
        .returning();
      if (!created) {
        throw new AdminContentDomainError("PERSISTENCE");
      }
      return created;
    });
  }

  async updateReview(
    id: string,
    input: ReviewContent,
  ): Promise<PersistedReview> {
    const [updated] = await this.db
      .update(reviews)
      .set({
        author: input.author,
        quote: input.quote,
        imageUrl: input.imageUrl,
        source: input.source,
        sourceUrl: input.sourceUrl,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    if (!updated) {
      throw new AdminContentDomainError("NOT_FOUND", {
        id: ["Отзыв не найден"],
      });
    }

    return updated;
  }

  async deleteReview(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.assertCanDelete(tx, "reviews");
      const deleted = await tx
        .delete(reviews)
        .where(eq(reviews.id, id))
        .returning({ id: reviews.id });
      if (deleted.length === 0) {
        throw new AdminContentDomainError("NOT_FOUND", {
          id: ["Отзыв не найден"],
        });
      }
      await this.compactSortOrders(tx, "reviews");
    });
  }

  async createCertificate(
    input: CertificateContent,
  ): Promise<PersistedCertificate> {
    return this.db.transaction(async (tx) => {
      await this.assertCanCreate(tx, "certificates");
      const sortOrder = await this.nextSortOrder(tx, certificates);
      const [created] = await tx
        .insert(certificates)
        .values({
          title: input.title,
          imageUrl: input.imageUrl,
          altText: input.altText,
          sortOrder,
        })
        .returning();
      if (!created) {
        throw new AdminContentDomainError("PERSISTENCE");
      }
      return created;
    });
  }

  async updateCertificate(
    id: string,
    input: CertificateContent,
  ): Promise<PersistedCertificate> {
    const [updated] = await this.db
      .update(certificates)
      .set({
        title: input.title,
        imageUrl: input.imageUrl,
        altText: input.altText,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id))
      .returning();

    if (!updated) {
      throw new AdminContentDomainError("NOT_FOUND", {
        id: ["Сертификат не найден"],
      });
    }

    return updated;
  }

  async deleteCertificate(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.assertCanDelete(tx, "certificates");
      const deleted = await tx
        .delete(certificates)
        .where(eq(certificates.id, id))
        .returning({ id: certificates.id });
      if (deleted.length === 0) {
        throw new AdminContentDomainError("NOT_FOUND", {
          id: ["Сертификат не найден"],
        });
      }
      await this.compactSortOrders(tx, "certificates");
    });
  }

  async reorder(
    entity: ReorderableEntity,
    orderedIds: string[],
  ): Promise<string[]> {
    return this.db.transaction(async (tx) => {
      const table = tableFor(entity);
      const rows = await tx
        .select({ id: table.id, sortOrder: table.sortOrder })
        .from(table)
        .for("update")
        .orderBy(asc(table.sortOrder));

      const currentIds = rows.map((row) => row.id);
      if (!sameIdSet(currentIds, orderedIds)) {
        throw new AdminContentDomainError("CONFLICT", {
          ids: ["Набор ID должен совпадать с существующими записями"],
        });
      }

      // Avoid unique sort_order collisions: move to high temps first.
      for (const [index, id] of orderedIds.entries()) {
        await tx
          .update(table)
          .set({
            sortOrder: 1_000_000 + index,
            updatedAt: new Date(),
          })
          .where(eq(table.id, id));
      }

      for (const [index, id] of orderedIds.entries()) {
        await tx
          .update(table)
          .set({
            sortOrder: index,
            updatedAt: new Date(),
          })
          .where(eq(table.id, id));
      }

      return orderedIds;
    });
  }

  private async assertCanCreate(
    tx: Transaction,
    entity: keyof typeof ENTITY_LIMITS,
  ): Promise<void> {
    const count = await this.countRows(tx, entity);
    if (count >= ENTITY_LIMITS[entity].max) {
      throw new AdminContentDomainError("CONFLICT", {
        _form: [`Достигнут лимит записей (${ENTITY_LIMITS[entity].max})`],
      });
    }
  }

  private async assertCanDelete(
    tx: Transaction,
    entity: keyof typeof ENTITY_LIMITS,
  ): Promise<void> {
    const count = await this.countRows(tx, entity);
    if (count <= ENTITY_LIMITS[entity].min) {
      throw new AdminContentDomainError("CONFLICT", {
        _form: [`Нельзя удалить: минимум ${ENTITY_LIMITS[entity].min}`],
      });
    }
  }

  private async countRows(
    tx: Transaction,
    entity: keyof typeof ENTITY_LIMITS,
  ): Promise<number> {
    const table = tableFor(entity);
    const [row] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(table);
    return row?.count ?? 0;
  }

  private async nextSortOrder(
    tx: Transaction,
    table:
      | typeof cases
      | typeof faqs
      | typeof reviews
      | typeof certificates
      | typeof services,
  ): Promise<number> {
    const [row] = await tx
      .select({ max: sql<number | null>`max(${table.sortOrder})` })
      .from(table);
    return (row?.max ?? -1) + 1;
  }

  private async compactSortOrders(
    tx: Transaction,
    entity: ReorderableEntity,
  ): Promise<void> {
    const table = tableFor(entity);
    const rows = await tx
      .select({ id: table.id })
      .from(table)
      .orderBy(asc(table.sortOrder));

    for (const [index, row] of rows.entries()) {
      await tx
        .update(table)
        .set({
          sortOrder: 1_000_000 + index,
          updatedAt: new Date(),
        })
        .where(eq(table.id, row.id));
    }

    for (const [index, row] of rows.entries()) {
      await tx
        .update(table)
        .set({
          sortOrder: index,
          updatedAt: new Date(),
        })
        .where(eq(table.id, row.id));
    }
  }
}

function tableFor(entity: ReorderableEntity) {
  switch (entity) {
    case "cases":
      return cases;
    case "faqs":
      return faqs;
    case "reviews":
      return reviews;
    case "certificates":
      return certificates;
    case "services":
      return services;
  }
}

function sameIdSet(current: string[], next: string[]): boolean {
  if (current.length !== next.length) {
    return false;
  }
  const currentSet = new Set(current);
  const nextSet = new Set(next);
  if (currentSet.size !== nextSet.size) {
    return false;
  }
  for (const id of currentSet) {
    if (!nextSet.has(id)) {
      return false;
    }
  }
  return true;
}
