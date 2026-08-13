import "server-only";

import { connection } from "next/server";

import { seedContent } from "@/db/seed-data";

import type { LandingData } from "./content.types";
import { mapLandingData } from "./map-landing-data";

const PREVIEW_TIMESTAMP = new Date("2026-07-12T00:00:00.000Z");

function withPersistenceFields<T extends { id: string; sortOrder: number }>(
  item: T,
) {
  return {
    ...item,
    createdAt: PREVIEW_TIMESTAMP,
    updatedAt: PREVIEW_TIMESTAMP,
  };
}

export function getPreviewLandingData(): LandingData {
  return mapLandingData({
    settings: seedContent.settings,
    services: seedContent.services.map(withPersistenceFields),
    cases: seedContent.cases.map(withPersistenceFields),
    faqs: seedContent.faqs.map(withPersistenceFields),
    reviews: seedContent.reviews.map(withPersistenceFields),
    certificates: seedContent.certificates.map(withPersistenceFields),
  });
}

export async function getLandingPageData(): Promise<LandingData> {
  if (!process.env.DATABASE_URL) return getPreviewLandingData();

  // Request-time read so CMS edits appear without a rebuild.
  // Static prerender was baking build-time DB/seed into HTML forever.
  await connection();

  try {
    const [{ DrizzleContentRepository }, { buildLandingData }] =
      await Promise.all([
        import("./content.repository"),
        import("./landing-data.service"),
      ]);
    return await buildLandingData(new DrizzleContentRepository());
  } catch (error) {
    console.error({
      event: "landing_page_data_fallback",
      category: "persistence",
      errorClass: error instanceof Error ? error.name : "UnknownError",
    });
    return getPreviewLandingData();
  }
}
