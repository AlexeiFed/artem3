import { z } from "zod";

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
} from "@/modules/content/content.schemas";
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
        .insert(services)
        .values(serviceRows)
        .onConflictDoNothing();
      await transaction.insert(cases).values(caseRows).onConflictDoNothing();
      await transaction.insert(faqs).values(faqRows).onConflictDoNothing();
      await transaction
        .insert(reviews)
        .values(reviewRows)
        .onConflictDoNothing();
      await transaction
        .insert(certificates)
        .values(certificateRows)
        .onConflictDoNothing();
    });

    const env = getServerEnv();
    await seedAdminUser(
      { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
      {
        upsert: async ({ email, passwordHash }) => {
          await db
            .insert(adminUsers)
            .values({ email, passwordHash, active: true })
            .onConflictDoUpdate({
              target: adminUsers.email,
              set: {
                passwordHash,
                active: true,
                updatedAt: new Date(),
              },
            });
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
