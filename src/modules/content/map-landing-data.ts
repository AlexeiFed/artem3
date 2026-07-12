import {
  ContactsSettingsSchema,
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
} from "./content.schemas";
import type { LandingData } from "./content.types";

export interface LandingContentSource {
  settings: {
    hero: unknown;
    trustBanner: unknown;
    workflow: unknown;
    contacts: unknown;
    legal: unknown;
    map: unknown;
    ratings: unknown;
    vkEmbed: unknown;
  };
  services: unknown[];
  cases: unknown[];
  faqs: unknown[];
  reviews: unknown[];
  certificates: unknown[];
}

export function mapLandingData(source: LandingContentSource): LandingData {
  const hero = HeroSettingsSchema.parse(source.settings.hero);
  const trust = TrustBannerSettingsSchema.parse(source.settings.trustBanner);
  const workflow = WorkflowSettingsSchema.parse(source.settings.workflow);
  const contacts = ContactsSettingsSchema.parse(source.settings.contacts);
  const legal = LegalSettingsSchema.parse(source.settings.legal);
  const map = MapSettingsSchema.parse(source.settings.map);
  const ratings = RatingsSettingsSchema.parse(source.settings.ratings);
  const vk = VkEmbedSettingsSchema.parse(source.settings.vkEmbed);
  const services = source.services.map((item) =>
    PersistedServiceSchema.parse(item),
  );
  const cases = source.cases.map((item) => PersistedCaseSchema.parse(item));
  const faqs = source.faqs.map((item) => PersistedFaqSchema.parse(item));
  const reviews = source.reviews.map((item) => PersistedReviewSchema.parse(item));
  const certificates = source.certificates.map((item) =>
    PersistedCertificateSchema.parse(item),
  );

  return LandingDataSchema.parse({
    meta: hero.meta,
    header: hero.header,
    hero: {
      ...hero.hero,
      video: {
        ...hero.hero.video,
        ...(vk.enabled ? { vkEmbed: vk.embed } : {}),
      },
    },
    quickLinks: hero.quickLinks,
    hiddenRisks: hero.hiddenRisks,
    services: services.map(
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
    consultation: trust.consultation,
    workflow,
    honesty: trust.honesty,
    cases: cases.map(({ situation, action, result }) => ({
      situation,
      action,
      result,
    })),
    ratings,
    reviews: reviews.map(
      ({ author, quote, imageUrl, source, sourceUrl }) => ({
        author,
        quote,
        imageUrl,
        source,
        sourceUrl,
      }),
    ),
    certificates: certificates.map(({ title, imageUrl, altText }) => ({
      title,
      imageUrl,
      altText,
    })),
    faqs: faqs.map(({ question, answer }) => ({ question, answer })),
    contacts: { ...contacts, map },
    legal,
  });
}
