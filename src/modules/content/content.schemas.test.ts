import { describe, expect, it } from "vitest";

import { seedContent } from "../../db/seed-data";

import {
  CertificateSchema,
  HeroSettingsSchema,
  LandingDataSchema,
  RatingSchema,
  RatingsSettingsSchema,
  ServiceSchema,
  TrustBannerSettingsSchema,
  VkEmbedSchema,
  WorkflowSettingsSchema,
} from "./content.schemas";
import type {
  HeroSettings,
  RatingsSettings,
} from "./content.types";
import { normalizeHonestySettings } from "./map-landing-data";

const APPROVED_SUBTITLE =
  "Нахожу оптимальное решение в семейных и имущественных спорах — через переговоры или в суде. Стоимость работы известна заранее.";
const APPROVED_METRICS = [
  { value: "11+", label: "лет практики" },
  { value: "380+", label: "клиентов получили помощь" },
  { value: "0 ₽", label: "скрытых платежей" },
];

function createValidHeroSettings(): HeroSettings {
  const settings = structuredClone(seedContent.settings.hero);
  return {
    ...settings,
    hero: {
      ...settings.hero,
      subtitle: APPROVED_SUBTITLE,
    },
  };
}

describe("HeroSettingsSchema", () => {
  it("defaults approved metrics for legacy hero settings", () => {
    const settings = createValidHeroSettings();
    const legacyHero = { ...settings.hero };
    Reflect.deleteProperty(legacyHero, "metrics");

    const parsed = HeroSettingsSchema.parse({
      ...settings,
      hero: legacyHero,
    });

    expect(parsed.hero.metrics).toEqual(APPROVED_METRICS);
  });

  it("requires exactly three hero metrics", () => {
    const settings = createValidHeroSettings();
    const result = HeroSettingsSchema.safeParse({
      ...settings,
      hero: {
        ...settings.hero,
        metrics: APPROVED_METRICS.slice(0, 2),
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a custom hero title and subtitle", () => {
    const validSettings = createValidHeroSettings();
    const result = HeroSettingsSchema.safeParse({
      ...validSettings,
      hero: {
        ...validSettings.hero,
        title: "Семейный юрист в Хабаровске",
        subtitle: "Произвольный маркетинговый подзаголовок для клиента",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty hero title", () => {
    const validSettings = createValidHeroSettings();
    const result = HeroSettingsSchema.safeParse({
      ...validSettings,
      hero: {
        ...validSettings.hero,
        title: "   ",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts the seeded hero subtitle", () => {
    expect(HeroSettingsSchema.safeParse(createValidHeroSettings()).success).toBe(
      true,
    );
  });

  it("rejects empty quick links", () => {
    const settings = createValidHeroSettings();
    settings.quickLinks = [];
    expect(HeroSettingsSchema.safeParse(settings).success).toBe(false);
  });

  it("rejects more than 12 quick links", () => {
    const settings = createValidHeroSettings();
    const [first] = settings.quickLinks;
    if (!first) throw new Error("Invalid quick-link fixture");
    settings.quickLinks = Array.from({ length: 13 }, (_, index) => ({
      ...first,
      slug: `link-${index}`,
      href: `#link-${index}`,
    }));
    expect(HeroSettingsSchema.safeParse(settings).success).toBe(false);
  });

  it("accepts reordered quick links", () => {
    const settings = createValidHeroSettings();
    const [first, second] = settings.quickLinks;
    if (!first || !second) throw new Error("Invalid quick-link fixture");
    settings.quickLinks[0] = second;
    settings.quickLinks[1] = first;
    expect(HeroSettingsSchema.safeParse(settings).success).toBe(true);
  });
});

describe("RatingsSettingsSchema", () => {
  it("requires exactly one Яндекс rating followed by one 2ГИС rating", () => {
    const ratings: RatingsSettings = structuredClone(
      seedContent.settings.ratings,
    );
    const [yandex, twoGis] = ratings.items;
    if (!yandex || !twoGis) throw new Error("Invalid ratings fixture");
    ratings.items[1] = { ...yandex, externalUrl: twoGis.externalUrl };

    const result = RatingsSettingsSchema.safeParse(ratings);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["items", 1, "source"],
            message: expect.stringContaining("2ГИС"),
          }),
        ]),
      );
    }
  });
});

describe("external URL security", () => {
  it.each([
    "javascript://vk.com/video",
    "ftp://example.com/resource",
    "http://example.com/resource",
  ])("rejects non-HTTPS public URL %s", (externalUrl) => {
    const [rating] = seedContent.settings.ratings.items;
    if (!rating) throw new Error("Invalid rating fixture");

    expect(RatingSchema.safeParse({ ...rating, externalUrl }).success).toBe(
      false,
    );
  });

  it.each([
    "https://vk.com/video-1_2",
    "https://video.vk.com/video-1_2",
    "https://media.vkvideo.ru/video-1_2",
  ])("accepts approved HTTPS VK URL %s", (url) => {
    expect(
      VkEmbedSchema.safeParse({ url, title: "Видео Артёма Сысуева" }).success,
    ).toBe(true);
  });

  it.each([
    "javascript://vk.com/video-1_2",
    "ftp://vk.com/video-1_2",
    "http://vk.com/video-1_2",
    "https://vk.com.evil.test/video-1_2",
    "https://vk.com@evil.test/video-1_2",
    "https://evilvk.com/video-1_2",
  ])("rejects unsafe VK URL %s", (url) => {
    expect(
      VkEmbedSchema.safeParse({ url, title: "Видео Артёма Сысуева" }).success,
    ).toBe(false);
  });

  it("keeps local hero asset paths valid", () => {
    expect(HeroSettingsSchema.safeParse(createValidHeroSettings()).success).toBe(
      true,
    );
  });
});

function serviceContentInput(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const first = seedContent.services[0];
  if (!first) throw new Error("Missing service fixture");
  return {
    slug: first.slug,
    title: first.title,
    description: first.description,
    situations: first.situations,
    trustNote: first.trustNote,
    priceFromKopecks: first.priceFromKopecks,
    isHighValue: first.isHighValue,
    isHidden: first.isHidden,
    ctaLabel: first.ctaLabel,
    iconUrl: first.iconUrl,
    ...overrides,
  };
}

describe("ServiceSchema", () => {
  it("defaults iconUrl to null when the admin has not uploaded an icon", () => {
    const withoutIcon = serviceContentInput();
    delete withoutIcon.iconUrl;

    expect(ServiceSchema.parse(withoutIcon).iconUrl).toBeNull();
  });

  it("accepts a local uploaded icon path", () => {
    expect(
      ServiceSchema.parse(
        serviceContentInput({ iconUrl: "/media/razvod-icon.png" }),
      ).iconUrl,
    ).toBe("/media/razvod-icon.png");
  });
});

describe("CertificateSchema", () => {
  it("accepts a single local diploma scan path", () => {
    const result = CertificateSchema.safeParse({
      title: "Диплом юриста, ХГТУ, 2004",
      imageUrl: "/media/artem-diploma.png",
      altText: "Диплом о высшем образовании Сысуева Артёма Артуровича",
    });

    expect(result.success).toBe(true);
  });

  it("allows exactly one certificate in landing data", () => {
    const landing = structuredClone({
      ...seedContent.settings.hero,
      consultation: seedContent.settings.trustBanner.consultation,
      workflow: seedContent.settings.workflow,
      honesty: seedContent.settings.trustBanner.honesty,
      cases: seedContent.cases.map(({ situation, action, result }) => ({
        situation,
        action,
        result,
      })),
      ratings: seedContent.settings.ratings,
      reviews: seedContent.reviews.map(
        ({ author, quote, imageUrl, source, sourceUrl }) => ({
          author,
          quote,
          imageUrl,
          source,
          sourceUrl,
        }),
      ),
      certificates: [
        {
          title: "Диплом юриста, ХГТУ, 2004",
          imageUrl: "/media/artem-diploma.png",
          altText: "Диплом о высшем образовании Сысуева Артёма Артуровича",
        },
      ],
      faqs: seedContent.faqs.map(({ question, answer }) => ({
        question,
        answer,
      })),
      contacts: {
        ...seedContent.settings.contacts,
        map: seedContent.settings.map,
      },
      legal: seedContent.settings.legal,
      quickLinks: seedContent.services
        .filter((item) => !item.isHidden)
        .map(({ slug, title }) => ({
          slug,
          label: title,
          href: `#${slug}`,
        })),
      hiddenRisks: seedContent.settings.hero.hiddenRisks,
      servicesIntro: seedContent.settings.hero.servicesIntro,
      services: seedContent.services
        .filter((item) => !item.isHidden)
        .map(
          ({
            slug,
            title,
            description,
            situations,
            trustNote,
            priceFromKopecks,
            isHighValue,
            ctaLabel,
            iconUrl,
          }) => ({
            slug,
            title,
            description,
            situations,
            trustNote,
            priceFromKopecks,
            isHighValue,
            ctaLabel,
            iconUrl,
          }),
        ),
      meta: seedContent.settings.hero.meta,
      header: seedContent.settings.hero.header,
      hero: seedContent.settings.hero.hero,
    });

    expect(LandingDataSchema.safeParse(landing).success).toBe(true);
  });
});

describe("normalizeHonestySettings", () => {
  it("upgrades exact production legacy trust_banner from Postgres", () => {
    const legacyFromDb = {
      honesty: {
        copy:
          "Я заранее называю сильные и слабые стороны позиции, возможные расходы и процессуальные риски. Если спор экономически невыгоден, скажу об этом до заключения договора.",
        theme: "Честно о результате",
        title: "Юрист не может обещать решение суда",
      },
      consultation: {
        cta: {
          label: "Записаться на разбор",
          target: "#contacts",
        },
        title: "Не общие советы, а рабочая карта дела",
        eyebrow: "Что будет на консультации",
        benefits: [
          "Разберём документы и восстановим хронологию событий.",
          "Отделим юридически значимые факты от эмоций и предположений.",
          "Сравним переговорный и судебный сценарии по срокам и затратам.",
          "Составим список ближайших действий и недостающих доказательств.",
        ],
      },
    };

    const parsed = TrustBannerSettingsSchema.safeParse(
      normalizeHonestySettings(legacyFromDb),
    );

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.honesty.items).toHaveLength(3);
      expect(parsed.data.honesty.title).toBe(
        "Юрист не может обещать решение суда",
      );
      expect(parsed.data.consultation.title).toBe(
        "Не общие советы, а рабочая карта дела",
      );
    }
  });
});

describe("optional eyebrows", () => {
  it("accepts an empty workflow eyebrow so the duplicate heading can be removed", () => {
    const parsed = WorkflowSettingsSchema.safeParse({
      ...structuredClone(seedContent.settings.workflow),
      eyebrow: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.eyebrow).toBe("");
  });

  it("accepts an empty honesty theme so the duplicate heading can be removed", () => {
    const trustBanner = structuredClone(seedContent.settings.trustBanner);
    const parsed = TrustBannerSettingsSchema.safeParse({
      ...trustBanner,
      honesty: { ...trustBanner.honesty, theme: "" },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.honesty.theme).toBe("");
  });
});
