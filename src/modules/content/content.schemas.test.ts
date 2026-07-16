import { describe, expect, it } from "vitest";

import { seedContent } from "../../db/seed-data";

import {
  HeroSettingsSchema,
  RatingSchema,
  RatingsSettingsSchema,
  VkEmbedSchema,
} from "./content.schemas";
import type {
  HeroSettings,
  RatingsSettings,
} from "./content.types";

const APPROVED_SUBTITLE =
  "Помогаю решить семейные и имущественные споры без лишнего стресса и затяжных судов";
const APPROVED_METRICS = [
  { value: "11+", label: "лет практики" },
  { value: "200+", label: "дел доведено до результата" },
  { value: "0 ₽", label: "первая консультация" },
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
