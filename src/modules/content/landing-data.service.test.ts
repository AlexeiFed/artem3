import { describe, expect, it } from "vitest";

import { seedContent } from "../../db/seed-data";

import type { ContentRepository } from "./content.repository";
import { ContentDataError, buildLandingData } from "./landing-data.service";

const timestamp = new Date("2026-07-12T00:00:00.000Z");

function createFakeRepository(
  settingsOverride?: Partial<Awaited<ReturnType<ContentRepository["getSiteSettings"]>>>,
  servicesOverride?: Awaited<ReturnType<ContentRepository["listServices"]>>,
): ContentRepository {
  const serviceRows = seedContent.services.map((item) => ({
    ...item,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  return {
    getSiteSettings: async () => ({
      id: "default",
      ...seedContent.settings,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...settingsOverride,
    }),
    listServices: async () => servicesOverride ?? serviceRows,
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

    expect(data.hero.metrics).toEqual([
      { value: "11+", label: "лет практики" },
      { value: "200+", label: "дел доведено до результата" },
      { value: "0 ₽", label: "первая консультация" },
    ]);
    expect(data.services.map((item) => item.slug)).toEqual([
      "razvod",
      "alimenty",
      "imushchestvo",
      "deti",
      "zemlya",
      "uslugi",
    ]);
    expect(data.services[0]).toEqual({
      slug: seedContent.services[0]?.slug,
      title: seedContent.services[0]?.title,
      description: seedContent.services[0]?.description,
      situations: seedContent.services[0]?.situations,
      trustNote: seedContent.services[0]?.trustNote,
      priceFromKopecks: seedContent.services[0]?.priceFromKopecks,
      isHighValue: seedContent.services[0]?.isHighValue,
    });
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

  it("rejects duplicate service slugs", async () => {
    const baseRepository = createFakeRepository();
    const serviceRows = await baseRepository.listServices();
    const [first, second] = serviceRows;
    if (!first || !second) throw new Error("Invalid services fixture");
    serviceRows[1] = { ...second, slug: first.slug };

    await expect(
      buildLandingData(createFakeRepository(undefined, serviceRows)),
    ).rejects.toEqual(new ContentDataError());
  });

  it("accepts reordered services when slugs stay unique", async () => {
    const baseRepository = createFakeRepository();
    const serviceRows = await baseRepository.listServices();
    const [first, second] = serviceRows;
    if (!first || !second) throw new Error("Invalid services fixture");
    serviceRows[0] = second;
    serviceRows[1] = first;

    const data = await buildLandingData(
      createFakeRepository(undefined, serviceRows),
    );
    expect(data.services[0]?.slug).toBe(second.slug);
    expect(data.services[1]?.slug).toBe(first.slug);
  });

  it("preserves the original internal failure as ContentDataError cause", async () => {
    const originalError = new Error(
      'SELECT * FROM admin_users WHERE password = "secret"',
    );
    const repository = createFakeRepository();
    repository.listServices = async () => {
      throw originalError;
    };

    let thrown: unknown;
    try {
      await buildLandingData(repository);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ContentDataError);
    if (!(thrown instanceof ContentDataError)) {
      throw new Error("Expected ContentDataError");
    }
    expect(thrown.message).toBe("Landing content is unavailable");
    expect(thrown.cause).toBe(originalError);
  });

  it("does not wrap an existing ContentDataError again", async () => {
    const originalError = new ContentDataError();
    const repository = createFakeRepository();
    repository.listServices = async () => {
      throw originalError;
    };

    await expect(buildLandingData(repository)).rejects.toBe(originalError);
  });
});
