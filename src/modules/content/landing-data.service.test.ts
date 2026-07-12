import { describe, expect, it } from "vitest";

import { seedContent } from "../../db/seed-data";

import type { ContentRepository } from "./content.repository";
import { ContentDataError, buildLandingData } from "./landing-data.service";

const timestamp = new Date("2026-07-12T00:00:00.000Z");

function createFakeRepository(
  settingsOverride?: Partial<Awaited<ReturnType<ContentRepository["getSiteSettings"]>>>,
): ContentRepository {
  return {
    getSiteSettings: async () => ({
      id: "default",
      ...seedContent.settings,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...settingsOverride,
    }),
    listServices: async () =>
      seedContent.services.map((item) => ({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    listCases: async () =>
      seedContent.cases.map((item) => ({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    listFaqs: async () =>
      seedContent.faqs.map((item) => ({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    listReviews: async () =>
      seedContent.reviews.map((item) => ({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    listCertificates: async () =>
      seedContent.certificates.map((item) => ({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
  };
}

describe("buildLandingData", () => {
  it("maps complete content in stable public order without persistence fields", async () => {
    const data = await buildLandingData(createFakeRepository());

    expect(data.services.map((item) => item.slug)).toEqual([
      "razvod",
      "alimenty",
      "imushchestvo",
      "deti",
      "zemlya",
      "uslugi",
    ]);
    expect(data.cases).toHaveLength(4);
    expect(data.faqs.length).toBeGreaterThanOrEqual(6);
    expect(data).not.toHaveProperty("id");
    expect(data.services[0]).not.toHaveProperty("id");
    expect(data.services[0]).not.toHaveProperty("sortOrder");
    expect(data.services[0]).not.toHaveProperty("createdAt");
    expect(data.cases[0]).not.toHaveProperty("updatedAt");
  });

  it("rejects malformed JSON settings with a stable internal error", async () => {
    const repository = createFakeRepository({ hero: { title: 42 } });

    await expect(buildLandingData(repository)).rejects.toEqual(
      new ContentDataError(),
    );
  });

  it("maps nullable review images and disabled VK embed exactly", async () => {
    const repository = createFakeRepository({
      vkEmbed: { enabled: false },
    });

    const data = await buildLandingData(repository);

    expect(data.hero.video.vkEmbed).toBeUndefined();
    expect(data.reviews.some((review) => review.imageUrl === null)).toBe(true);
  });
});
