import type { LandingData } from "@/modules/content/content.types";

const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=86400";
const SAFE_ERROR_MESSAGE =
  "Не удалось загрузить данные страницы. Попробуйте ещё раз позже.";

interface LandingDataHandlerDependencies {
  loadLandingData(): Promise<LandingData>;
}

export function createLandingDataHandler({
  loadLandingData,
}: LandingDataHandlerDependencies): () => Promise<Response> {
  return async function handleLandingData(): Promise<Response> {
    try {
      const data = await loadLandingData();

      return Response.json(
        { ok: true, data },
        {
          status: 200,
          headers: { "Cache-Control": PUBLIC_CACHE_CONTROL },
        },
      );
    } catch {
      return Response.json(
        {
          ok: false,
          error: {
            code: "LANDING_DATA_UNAVAILABLE",
            message: SAFE_ERROR_MESSAGE,
          },
        },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  };
}

async function loadLandingDataFromDatabase(): Promise<LandingData> {
  const [{ DrizzleContentRepository }, { buildLandingData }] =
    await Promise.all([
      import("@/modules/content/content.repository"),
      import("@/modules/content/landing-data.service"),
    ]);

  return buildLandingData(new DrizzleContentRepository());
}

export const GET = createLandingDataHandler({
  loadLandingData: loadLandingDataFromDatabase,
});
