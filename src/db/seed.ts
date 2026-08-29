import { z } from "zod";
import { eq } from "drizzle-orm";

import {
  CaseSchema,
  CertificateSchema,
  ContactsSettingsSchema,
  FaqSchema,
  HeroSettingsSchema,
  LegalSettingsSchema,
  MapSettingsSchema,
  RatingsSettingsSchema,
  ReviewSchema,
  ServiceSchema,
  TrustBannerSettingsSchema,
  VkEmbedSettingsSchema,
  WorkflowSettingsSchema,
  AnalyticsSettingsSchema,
} from "@/modules/content/content.schemas";
import { normalizeHonestySettings } from "@/modules/content/map-landing-data";
import { mergeSeedHero } from "@/modules/content/merge-seed-hero";
import { getServerEnv } from "@/lib/env/server";
import { seedAdminUser } from "@/modules/auth/seed-admin";

import { getDb, getPostgresClient } from "./client";
import { seedContent } from "./seed-data";
import {
  adminUsers,
  cases,
  certificates,
  faqs,
  reviews,
  services,
  siteSettings,
} from "./schema";

const seedIdentitySchema = z.object({
  id: z.uuid(),
  sortOrder: z.number().int().min(0),
});

const seedServiceSchema = seedIdentitySchema.extend(ServiceSchema.shape);
const seedCaseSchema = seedIdentitySchema.extend(CaseSchema.shape);
const seedFaqSchema = seedIdentitySchema.extend(FaqSchema.shape);
const seedReviewSchema = seedIdentitySchema.extend(ReviewSchema.shape);
const seedCertificateSchema = seedIdentitySchema.extend(CertificateSchema.shape);

async function runSeed(): Promise<void> {
  const client = getPostgresClient();

  try {
    const db = getDb();
    const settings = {
      id: "default",
      hero: HeroSettingsSchema.parse(seedContent.settings.hero),
      trustBanner: TrustBannerSettingsSchema.parse(
        seedContent.settings.trustBanner,
      ),
      workflow: WorkflowSettingsSchema.parse(seedContent.settings.workflow),
      contacts: ContactsSettingsSchema.parse(seedContent.settings.contacts),
      legal: LegalSettingsSchema.parse(seedContent.settings.legal),
      map: MapSettingsSchema.parse(seedContent.settings.map),
      ratings: RatingsSettingsSchema.parse(seedContent.settings.ratings),
      vkEmbed: VkEmbedSettingsSchema.parse(seedContent.settings.vkEmbed),
      analytics: AnalyticsSettingsSchema.parse(seedContent.settings.analytics),
    };
    const serviceRows = seedContent.services.map((item) =>
      seedServiceSchema.parse(item),
    );
    const caseRows = seedContent.cases.map((item) =>
      seedCaseSchema.parse(item),
    );
    const faqRows = seedContent.faqs.map((item) => seedFaqSchema.parse(item));
    const reviewRows = seedContent.reviews.map((item) =>
      seedReviewSchema.parse(item),
    );
    const certificateRows = seedContent.certificates.map((item) =>
      seedCertificateSchema.parse(item),
    );

    await db.transaction(async (transaction) => {
      await transaction
        .insert(siteSettings)
        .values(settings)
        .onConflictDoNothing();

      await transaction
        .update(siteSettings)
        .set({
          legal: settings.legal,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, "default"));

      // Legacy honesty.copy → items (не трогаем остальные settings).
      const [existingSettings] = await transaction
        .select({
          hero: siteSettings.hero,
          trustBanner: siteSettings.trustBanner,
        })
        .from(siteSettings)
        .where(eq(siteSettings.id, "default"))
        .limit(1);
      if (existingSettings) {
        await transaction
          .update(siteSettings)
          .set({
            hero: mergeSeedHero(existingSettings.hero, settings.hero),
            updatedAt: new Date(),
          })
          .where(eq(siteSettings.id, "default"));

        const current = existingSettings.trustBanner as {
          honesty?: { items?: unknown };
        };
        const hasItems =
          Array.isArray(current.honesty?.items) &&
          current.honesty.items.length === 3;
        if (!hasItems) {
          await transaction
            .update(siteSettings)
            .set({
              trustBanner: TrustBannerSettingsSchema.parse(
                normalizeHonestySettings(existingSettings.trustBanner),
              ),
              updatedAt: new Date(),
            })
            .where(eq(siteSettings.id, "default"));
        }
      }

      await transaction
        .insert(services)
        .values(serviceRows)
        .onConflictDoNothing();

      const razvod = serviceRows[0];
      if (razvod) {
        await transaction
          .update(services)
          .set({ trustNote: razvod.trustNote, updatedAt: new Date() })
          .where(eq(services.id, razvod.id));
      }
      await transaction.insert(cases).values(caseRows).onConflictDoNothing();
      for (const row of caseRows) {
        await transaction
          .update(cases)
          .set({
            situation: row.situation,
            action: row.action,
            result: row.result,
            updatedAt: new Date(),
          })
          .where(eq(cases.id, row.id));
      }
      await transaction.insert(faqs).values(faqRows).onConflictDoNothing();
      await transaction
        .insert(reviews)
        .values(reviewRows)
        .onConflictDoNothing();
      // Сертификаты — контент сида: полностью перезаписываем (убрали плейсхолдеры).
      await transaction.delete(certificates);
      await transaction.insert(certificates).values(certificateRows);
    });

    const env = getServerEnv();
    await seedAdminUser(
      { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
      {
        repository: {
          findByEmail: async (email) => {
            const [user] = await db
              .select({
                id: adminUsers.id,
                passwordHash: adminUsers.passwordHash,
                active: adminUsers.active,
              })
              .from(adminUsers)
              .where(eq(adminUsers.email, email))
              .limit(1);
            return user ?? null;
          },
          create: async ({ email, passwordHash, active }) => {
            await db
              .insert(adminUsers)
              .values({ email, passwordHash, active })
              .onConflictDoNothing({ target: adminUsers.email });
          },
        },
      },
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

void runSeed().catch((error: unknown) => {
  console.error({
    event: "database_seed_failed",
    errorClass: error instanceof Error ? error.name : "UnknownError",
  });
  process.exitCode = 1;
});
