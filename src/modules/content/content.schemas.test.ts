import { describe, expect, it } from "vitest";

import { seedContent } from "../../db/seed-data";

import {
  HeroSettingsSchema,
  RatingsSettingsSchema,
} from "./content.schemas";
import type {
  HeroSettings,
  RatingsSettings,
} from "./content.types";

const APPROVED_SUBTITLE =
  "Помогаю решить семейные и имущественные споры без лишнего стресса и затяжных судов";

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
