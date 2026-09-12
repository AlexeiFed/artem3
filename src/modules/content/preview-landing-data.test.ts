import { describe, expect, it } from "vitest";

import { seedContent } from "@/db/seed-data";

import { LandingDataSchema } from "./content.schemas";
import {
  getLandingPageData,
  getPreviewLandingData,
} from "./preview-landing-data";

describe("getPreviewLandingData", () => {
  it("maps seed content into the validated public contract", () => {
    const data = getPreviewLandingData();

    expect(LandingDataSchema.safeParse(data).success).toBe(true);
    const visibleSlugs = seedContent.services
      .filter((item) => !item.isHidden)
      .map((item) => item.slug);
    expect(data.services).toHaveLength(visibleSlugs.length);
    expect(data.quickLinks).toHaveLength(visibleSlugs.length);
    expect(data.quickLinks.map((item) => item.slug)).toEqual(visibleSlugs);
    expect(data.cases).toHaveLength(4);
    expect(data.faqs.length).toBeGreaterThanOrEqual(6);
  });
});

describe("getLandingPageData", () => {
  it("falls back to preview seed when DATABASE_URL is unset", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const data = await getLandingPageData();
      expect(data).toEqual(getPreviewLandingData());
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });

  it("does not serve seed when the database is configured and load fails", async () => {
    await expect(
      getLandingPageData({
        hasDatabase: true,
        connect: async () => undefined,
        loadFromDatabase: async () => {
          throw new Error("db down");
        },
      }),
    ).rejects.toThrow("db down");
  });
});
