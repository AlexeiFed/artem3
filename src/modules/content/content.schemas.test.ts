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

  it("requires the exact approved hero subtitle", () => {
    const validSettings = createValidHeroSettings();
    const settings = {
      ...validSettings,
      hero: {
        ...validSettings.hero,
        subtitle: "Произвольный маркетинговый подзаголовок",
      },
    };

    const result = HeroSettingsSchema.safeParse(settings);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["hero", "subtitle"],
            message: expect.stringContaining("утверждённому тексту"),
          }),
        ]),
      );
    }
  });

  it("accepts the exact approved hero subtitle", () => {
    expect(HeroSettingsSchema.safeParse(createValidHeroSettings()).success).toBe(
      true,
    );
  });

  it.each([
    {
      name: "duplicate slug",
      mutate: () => {
        const settings = createValidHeroSettings();
        const [first, second] = settings.quickLinks;
        if (!first || !second) throw new Error("Invalid quick-link fixture");
        settings.quickLinks[1] = { ...first, label: second.label };
        return settings;
      },
    },
    {
      name: "missing link",
      mutate: () => {
        const settings = createValidHeroSettings();
        settings.quickLinks = settings.quickLinks.slice(0, -1);
        return settings;
      },
    },
    {
      name: "wrong href",
      mutate: () => {
        const settings = createValidHeroSettings();
        const [first] = settings.quickLinks;
        if (!first) throw new Error("Invalid quick-link fixture");
        settings.quickLinks[0] = { ...first, href: "#alimenty" };
        return settings;
      },
    },
    {
      name: "order drift",
      mutate: () => {
        const settings = createValidHeroSettings();
        const [first, second] = settings.quickLinks;
        if (!first || !second) throw new Error("Invalid quick-link fixture");
        settings.quickLinks[0] = second;
        settings.quickLinks[1] = first;
        return settings;
      },
    },
  ])("rejects quick links with $name", ({ mutate }) => {
    const result = HeroSettingsSchema.safeParse(mutate());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toEqual(
        expect.objectContaining({
          path: expect.arrayContaining(["quickLinks"]),
          message: expect.any(String),
        }),
      );
    }
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
