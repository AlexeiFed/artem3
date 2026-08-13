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
import { ensureHomeNavItem } from "./ensure-home-nav";
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

const DEFAULT_CONTACTS_EMAIL = {
  label: "Email",
  address: "artem@vibespace27.ru",
} as const;

const DEFAULT_RESPONSE_SLA =
  "Отвечаю в течение 1 часа в рабочее время (с 9:00 до 18:00 по Хабаровску)";

const DEFAULT_HOURS_NOTE = "(по предварительной записи)";

const DEFAULT_HONESTY_ITEMS = [
  {
    title: "Честно оцениваю перспективы",
    copy:
      "Если понимаю, что добиться желаемого результата невозможно, говорю об этом сразу — ещё на первой консультации.",
  },
  {
    title: "Работаю только с реальными задачами",
    copy:
      "Предлагаю только те решения, которые имеют правовые основания и действительно могут помочь в вашей ситуации.",
  },
  {
    title: "Прозрачный подход",
    copy:
      "Объясняю стратегию работы, заранее согласовываю стоимость услуг и держу вас в курсе каждого этапа дела.",
  },
] as const;

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
    email?: { label?: string; address?: string };
    responseSla?: string;
    hoursNote?: string;
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
    email: contacts.email ?? DEFAULT_CONTACTS_EMAIL,
    responseSla: contacts.responseSla ?? DEFAULT_RESPONSE_SLA,
    hoursNote:
      typeof contacts.hoursNote === "string"
        ? contacts.hoursNote
        : DEFAULT_HOURS_NOTE,
  };
}

export function normalizeHonestySettings(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const trustBanner = raw as {
    consultation?: unknown;
    honesty?: {
      theme?: string;
      title?: string;
      copy?: string;
      items?: Array<{ title?: string; copy?: string }>;
    };
  };
  const honesty = trustBanner.honesty;
  if (!honesty || typeof honesty !== "object") return raw;

  if (Array.isArray(honesty.items) && honesty.items.length === 3) {
    return raw;
  }

  return {
    ...trustBanner,
    honesty: {
      theme: honesty.theme ?? "Почему мне доверяют",
      title: honesty.title ?? "Почему мне доверяют",
      items: DEFAULT_HONESTY_ITEMS.map((item) => ({ ...item })),
    },
  };
}

export function mapLandingData(source: LandingContentSource): LandingData {
  const hero = HeroSettingsSchema.parse(
    normalizeHeroSettings(source.settings.hero),
  );
  const trust = TrustBannerSettingsSchema.parse(
    normalizeHonestySettings(source.settings.trustBanner),
  );
  const workflow = WorkflowSettingsSchema.parse(source.settings.workflow);
  const contacts = ContactsSettingsSchema.parse(
    normalizeContactsSettings(source.settings.contacts),
  );
  const legal = LegalSettingsSchema.parse(source.settings.legal);
  const map = MapSettingsSchema.parse(source.settings.map);
  const ratings = RatingsSettingsSchema.parse(source.settings.ratings);
  const vk = VkEmbedSettingsSchema.parse(source.settings.vkEmbed);
  const services = source.services
    .map((item) => PersistedServiceSchema.parse(item))
    .filter((item) => !item.isHidden);
  const cases = source.cases.map((item) => PersistedCaseSchema.parse(item));
  const faqs = source.faqs.map((item) => PersistedFaqSchema.parse(item));
  const reviews = source.reviews.map((item) => PersistedReviewSchema.parse(item));
  const certificates = source.certificates.map((item) =>
    PersistedCertificateSchema.parse(item),
  );

  return LandingDataSchema.parse({
    meta: hero.meta,
    header: {
      ...hero.header,
      nav: ensureHomeNavItem(hero.header.nav).slice(0, 8),
    },
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
        ctaLabel,
      }) => ({
        slug,
        title,
        description,
        situations,
        trustNote,
        priceFromKopecks,
        isHighValue,
        ctaLabel,
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
