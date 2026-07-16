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
import { serviceAnchorHref } from "./service-anchors";

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

/** Old seed used `#uslugi` for the last service; that collides with section id. */
function normalizeHeroSettings(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const hero = raw as { quickLinks?: Array<{ slug?: string; href?: string }> };
  if (!Array.isArray(hero.quickLinks)) return raw;
  return {
    ...hero,
    quickLinks: hero.quickLinks.map((link) =>
      link?.slug === "uslugi" && link.href === "#uslugi"
        ? { ...link, href: "#prochee" }
        : link,
    ),
  };
}

function normalizeContactsSettings(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const contacts = raw as {
    telegram?: { label?: string; url?: string };
    whatsapp?: { label?: string; url?: string };
    max?: { label?: string; url?: string };
  };
  const telegramUrl = contacts.telegram?.url?.replace(
    /^https:\/\/t\.me\//u,
    "https://telegram.me/",
  );
  return {
    ...contacts,
    ...(contacts.telegram
      ? {
          telegram: {
            label: contacts.telegram.label ?? "Telegram",
            url: telegramUrl ?? contacts.telegram.url,
          },
        }
      : {}),
    max: contacts.max ?? {
      label: "MAX",
      url: "https://max.ru/",
    },
  };
}

export function mapLandingData(source: LandingContentSource): LandingData {
  const hero = HeroSettingsSchema.parse(
    normalizeHeroSettings(source.settings.hero),
  );
  const trust = TrustBannerSettingsSchema.parse(source.settings.trustBanner);
  const workflow = WorkflowSettingsSchema.parse(source.settings.workflow);
  const contacts = ContactsSettingsSchema.parse(
    normalizeContactsSettings(source.settings.contacts),
  );
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
    quickLinks: services.map(({ slug, title }) => ({
      slug,
      label: title,
      href: serviceAnchorHref(slug),
    })),
    hiddenRisks: hero.hiddenRisks,
    servicesIntro: hero.servicesIntro,
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
