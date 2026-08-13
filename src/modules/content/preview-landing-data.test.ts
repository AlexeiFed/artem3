import { describe, expect, it } from "vitest";

import { LandingDataSchema } from "./content.schemas";
import {
  getLandingPageData,
  getPreviewLandingData,
} from "./preview-landing-data";

describe("getPreviewLandingData", () => {
  it("maps seed content into the validated public contract", () => {
    const data = getPreviewLandingData();

    expect(LandingDataSchema.safeParse(data).success).toBe(true);
    expect(data.services).toHaveLength(5);
    expect(data.services.map((item) => item.slug)).not.toContain("zemlya");
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
});
