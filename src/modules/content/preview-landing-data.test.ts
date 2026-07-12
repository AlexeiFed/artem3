import { describe, expect, it } from "vitest";

import { LandingDataSchema } from "./content.schemas";
import { getPreviewLandingData } from "./preview-landing-data";

describe("getPreviewLandingData", () => {
  it("maps seed content into the validated public contract", () => {
    const data = getPreviewLandingData();

    expect(LandingDataSchema.safeParse(data).success).toBe(true);
    expect(data.services).toHaveLength(6);
    expect(data.cases).toHaveLength(4);
    expect(data.faqs.length).toBeGreaterThanOrEqual(6);
  });
});
