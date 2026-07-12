import {
  HeroSettingsSchema,
  LandingDataSchema,
  LegalSettingsSchema,
  MapSettingsSchema,
  PersistedCaseSchema,
  PersistedCertificateSchema,
  PersistedFaqSchema,
  PersistedReviewSchema,
  PersistedServiceSchema,
  RatingsSettingsSchema,
  TrustBannerSettingsSchema,
  VkEmbedSettingsSchema,
  WorkflowSettingsSchema,
  ContactsSettingsSchema,
} from "./content.schemas";
import type { ContentRepository } from "./content.repository";
import type { LandingData } from "./content.types";

export class ContentDataError extends Error {
  readonly code = "CONTENT_DATA_INVALID";

  constructor() {
    super("Landing content is unavailable");
    this.name = "ContentDataError";
  }
}

export async function buildLandingData(
  repository: ContentRepository,
): Promise<LandingData> {
  try {
    const [settingsRow, serviceRows, caseRows, faqRows, reviewRows, certificateRows] =
      await Promise.all([
        repository.getSiteSettings(),
        repository.listServices(),
        repository.listCases(),
        repository.listFaqs(),
        repository.listReviews(),
        repository.listCertificates(),
      ]);

    if (!settingsRow) {
      throw new ContentDataError();
    }

    const heroSettings = HeroSettingsSchema.parse(settingsRow.hero);
    const trustBanner = TrustBannerSettingsSchema.parse(
      settingsRow.trustBanner,
    );
    const workflow = WorkflowSettingsSchema.parse(settingsRow.workflow);
    const contacts = ContactsSettingsSchema.parse(settingsRow.contacts);
    const legal = LegalSettingsSchema.parse(settingsRow.legal);
    const map = MapSettingsSchema.parse(settingsRow.map);
    const ratings = RatingsSettingsSchema.parse(settingsRow.ratings);
    const vkEmbed = VkEmbedSettingsSchema.parse(settingsRow.vkEmbed);

    const parsedServices = serviceRows.map((row) =>
      PersistedServiceSchema.parse(row),
    );
    const parsedCases = caseRows.map((row) => PersistedCaseSchema.parse(row));
    const parsedFaqs = faqRows.map((row) => PersistedFaqSchema.parse(row));
    const parsedReviews = reviewRows.map((row) =>
      PersistedReviewSchema.parse(row),
    );
    const parsedCertificates = certificateRows.map((row) =>
      PersistedCertificateSchema.parse(row),
    );

    return LandingDataSchema.parse({
      meta: heroSettings.meta,
      header: heroSettings.header,
      hero: {
        ...heroSettings.hero,
        video: {
          ...heroSettings.hero.video,
          ...(vkEmbed.enabled ? { vkEmbed: vkEmbed.embed } : {}),
        },
      },
      quickLinks: heroSettings.quickLinks,
      hiddenRisks: heroSettings.hiddenRisks,
      services: parsedServices.map(
        ({
          slug,
          title,
          description,
          situations,
          trustNote,
          priceFromKopecks,
          isHighValue,
        }) => ({
          slug,
          title,
          description,
          situations,
          trustNote,
          priceFromKopecks,
          isHighValue,
        }),
      ),
      consultation: trustBanner.consultation,
      workflow,
      honesty: trustBanner.honesty,
      cases: parsedCases.map(({ situation, action, result }) => ({
        situation,
        action,
        result,
      })),
      ratings,
      reviews: parsedReviews.map(
        ({ author, quote, imageUrl, source, sourceUrl }) => ({
          author,
          quote,
          imageUrl,
          source,
          sourceUrl,
        }),
      ),
      certificates: parsedCertificates.map(
        ({ title, imageUrl, altText }) => ({
          title,
          imageUrl,
          altText,
        }),
      ),
      faqs: parsedFaqs.map(({ question, answer }) => ({ question, answer })),
      contacts: {
        ...contacts,
        map,
      },
      legal,
    });
  } catch {
    throw new ContentDataError();
  }
}
