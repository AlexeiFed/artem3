import type { LandingData } from "@/modules/content/content.types";

import {
  LANDING_DATA_UNAVAILABLE_MESSAGE,
  LandingDataErrorResponseSchema,
  LandingDataSuccessResponseSchema,
} from "../../../modules/content/landing-data.contract";

const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=86400";

interface LandingDataHandlerDependencies {
  loadLandingData(): Promise<LandingData>;
  logger?: LandingDataLogger;
}

interface LandingDataFailureDiagnostic {
  event: "landing_data_unavailable";
  errorName: "ContentDataError" | "Error" | "UnknownError";
  code: "CONTENT_DATA_INVALID" | "UNEXPECTED_ERROR";
  category: "content" | "internal";
}

interface LandingDataLogger {
  error(diagnostic: LandingDataFailureDiagnostic): void;
}

export function createLandingDataHandler({
  loadLandingData,
  logger = console,
}: LandingDataHandlerDependencies): () => Promise<Response> {
  return async function handleLandingData(): Promise<Response> {
    try {
      const data = await loadLandingData();
      const body = LandingDataSuccessResponseSchema.parse({ ok: true, data });

      return Response.json(
        body,
        {
          status: 200,
          headers: { "Cache-Control": PUBLIC_CACHE_CONTROL },
        },
      );
    } catch (error) {
      logger.error(createSafeDiagnostic(error));
      const body = LandingDataErrorResponseSchema.parse({
        ok: false,
        error: {
          code: "LANDING_DATA_UNAVAILABLE",
          message: LANDING_DATA_UNAVAILABLE_MESSAGE,
        },
      });

      return Response.json(
        body,
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  };
}

function createSafeDiagnostic(error: unknown): LandingDataFailureDiagnostic {
  if (
    error instanceof Error &&
    error.name === "ContentDataError" &&
    "code" in error &&
    error.code === "CONTENT_DATA_INVALID"
  ) {
    return {
      event: "landing_data_unavailable",
      errorName: "ContentDataError",
      code: "CONTENT_DATA_INVALID",
      category: "content",
    };
  }

  return {
    event: "landing_data_unavailable",
    errorName: error instanceof Error ? "Error" : "UnknownError",
    code: "UNEXPECTED_ERROR",
    category: "internal",
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
