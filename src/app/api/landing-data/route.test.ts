import { describe, expect, it, vi } from "vitest";

import { seedContent } from "../../../db/seed-data";
import { LandingDataSchema } from "../../../modules/content/content.schemas";
import {
  LandingDataErrorResponseSchema,
  LandingDataSuccessResponseSchema,
} from "../../../modules/content/landing-data.contract";

import { createLandingDataHandler } from "./route";

function createLandingDataFixture() {
  const { settings } = seedContent;

  return LandingDataSchema.parse({
    meta: settings.hero.meta,
    header: settings.hero.header,
    hero: {
      ...settings.hero.hero,
      video: settings.hero.hero.video,
    },
    quickLinks: settings.hero.quickLinks,
    hiddenRisks: settings.hero.hiddenRisks,
    servicesIntro: settings.hero.servicesIntro,
    services: seedContent.services.map(
      ({
        slug,
        title,
        description,
        situations,
        trustNote,
        priceFromKopecks,
        isHighValue,
      }) => ({
        slug,
        title,
        description,
        situations,
        trustNote,
        priceFromKopecks,
        isHighValue,
      }),
    ),
    consultation: settings.trustBanner.consultation,
    workflow: settings.workflow,
    honesty: settings.trustBanner.honesty,
    cases: seedContent.cases.map(({ situation, action, result }) => ({
      situation,
      action,
      result,
    })),
    ratings: settings.ratings,
    reviews: seedContent.reviews.map(
      ({ author, quote, imageUrl, source, sourceUrl }) => ({
        author,
        quote,
        imageUrl,
        source,
        sourceUrl,
      }),
    ),
    certificates: seedContent.certificates.map(
      ({ title, imageUrl, altText }) => ({ title, imageUrl, altText }),
    ),
    faqs: seedContent.faqs.map(({ question, answer }) => ({
      question,
      answer,
    })),
    contacts: {
      ...settings.contacts,
      map: settings.map,
    },
    legal: settings.legal,
  });
}

describe("GET /api/landing-data", () => {
  it("returns schema-valid data with public cache headers", async () => {
    const data = createLandingDataFixture();
    const handler = createLandingDataHandler({
      loadLandingData: async () => data,
    });

    const response = await handler();
    const body = LandingDataSuccessResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.data.hero.title).toBe(
      "Развод, алименты\nи раздел имущества\nв Хабаровске",
    );
    expect(body.data.hero.metrics).toEqual([
      { value: "11+", label: "лет практики" },
      { value: "380+", label: "клиентов получили помощь" },
      { value: "0 ₽", label: "скрытых платежей" },
    ]);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=86400",
    );
  });

  it("returns a stable safe error without internal details", async () => {
    const logError = vi.fn();
    const handler = createLandingDataHandler({
      loadLandingData: async () => {
        throw new Error(
          'SELECT * FROM admin_users; password="secret"\n at database.ts:42',
        );
      },
      logger: { error: logError },
    });

    const response = await handler();
    const rawBody: unknown = await response.json();
    const body = LandingDataErrorResponseSchema.parse(rawBody);
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(serialized).not.toContain("SELECT");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("database.ts");
    expect(logError).toHaveBeenCalledWith({
      event: "landing_data_unavailable",
      errorName: "Error",
      code: "UNEXPECTED_ERROR",
      category: "internal",
    });
    expect(JSON.stringify(logError.mock.calls)).not.toMatch(
      /SELECT|password|secret|database\.ts/i,
    );
  });
});
