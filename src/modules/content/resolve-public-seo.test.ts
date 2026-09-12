import { describe, expect, it } from "vitest";

import { DEFAULT_SEO_SETTINGS } from "./content.schemas";
import { SITE_DESCRIPTION, SITE_TITLE } from "./site-metadata";
import { resolvePublicSeo } from "./resolve-public-seo";

describe("resolvePublicSeo", () => {
  it("reads Title and Description from stored hero settings", () => {
    expect(
      resolvePublicSeo({
        seo: {
          title: "Семейный юрист в Хабаровске",
          description: "Оценю перспективы дела в Хабаровске.",
        },
      }),
    ).toEqual({
      title: "Семейный юрист в Хабаровске",
      description: "Оценю перспективы дела в Хабаровске.",
      ogSiteName: DEFAULT_SEO_SETTINGS.ogSiteName,
      ogTitle: DEFAULT_SEO_SETTINGS.ogTitle,
      ogDescription: DEFAULT_SEO_SETTINGS.ogDescription,
    });
  });

  it("falls back to site defaults when seo is missing", () => {
    expect(resolvePublicSeo({})).toEqual({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      ogSiteName: DEFAULT_SEO_SETTINGS.ogSiteName,
      ogTitle: DEFAULT_SEO_SETTINGS.ogTitle,
      ogDescription: DEFAULT_SEO_SETTINGS.ogDescription,
    });
  });
});
