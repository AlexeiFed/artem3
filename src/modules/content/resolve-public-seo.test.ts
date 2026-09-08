import { describe, expect, it } from "vitest";

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
    });
  });

  it("falls back to site defaults when seo is missing", () => {
    expect(resolvePublicSeo({})).toEqual({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    });
  });
});
