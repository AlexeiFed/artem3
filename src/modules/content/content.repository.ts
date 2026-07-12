import "server-only";

import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  cases,
  certificates,
  faqs,
  reviews,
  services,
} from "@/db/schema";

type Database = ReturnType<typeof getDb>;
type ServiceRow = typeof services.$inferSelect;
type CaseRow = typeof cases.$inferSelect;
type FaqRow = typeof faqs.$inferSelect;
type ReviewRow = typeof reviews.$inferSelect;
type CertificateRow = typeof certificates.$inferSelect;

export interface SiteSettingsRow {
  id: string;
  hero: unknown;
  trustBanner: unknown;
  workflow: unknown;
  contacts: unknown;
  legal: unknown;
  map: unknown;
  ratings: unknown;
  vkEmbed: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentRepository {
  getSiteSettings(): Promise<SiteSettingsRow | undefined>;
  listServices(): Promise<ServiceRow[]>;
  listCases(): Promise<CaseRow[]>;
  listFaqs(): Promise<FaqRow[]>;
  listReviews(): Promise<ReviewRow[]>;
  listCertificates(): Promise<CertificateRow[]>;
}

export class DrizzleContentRepository implements ContentRepository {
  constructor(private readonly db: Database = getDb()) {}

  getSiteSettings(): Promise<SiteSettingsRow | undefined> {
    return this.db.query.siteSettings.findFirst({
      where: (settings, { eq }) => eq(settings.id, "default"),
    });
  }

  listServices(): Promise<ServiceRow[]> {
    return this.db.select().from(services).orderBy(asc(services.sortOrder));
  }

  listCases(): Promise<CaseRow[]> {
    return this.db.select().from(cases).orderBy(asc(cases.sortOrder));
  }

  listFaqs(): Promise<FaqRow[]> {
    return this.db.select().from(faqs).orderBy(asc(faqs.sortOrder));
  }

  listReviews(): Promise<ReviewRow[]> {
    return this.db.select().from(reviews).orderBy(asc(reviews.sortOrder));
  }

  listCertificates(): Promise<CertificateRow[]> {
    return this.db
      .select()
      .from(certificates)
      .orderBy(asc(certificates.sortOrder));
  }
}
