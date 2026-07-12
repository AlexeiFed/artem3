import type { ContentRepository } from "./content.repository";
import type { LandingData } from "./content.types";
import { mapLandingData } from "./map-landing-data";

export class ContentDataError extends Error {
  readonly code = "CONTENT_DATA_INVALID";

  constructor(cause?: unknown) {
    super(
      "Landing content is unavailable",
      cause === undefined ? undefined : { cause },
    );
    this.name = "ContentDataError";
  }
}

export async function buildLandingData(
  repository: ContentRepository,
): Promise<LandingData> {
  try {
    const [settingsRow, serviceRows, caseRows, faqRows, reviewRows, certificateRows] =
      await Promise.all([
        repository.getSiteSettings(),
        repository.listServices(),
        repository.listCases(),
        repository.listFaqs(),
        repository.listReviews(),
        repository.listCertificates(),
      ]);

    if (!settingsRow) {
      throw new ContentDataError();
    }

    return mapLandingData({
      settings: settingsRow,
      services: serviceRows,
      cases: caseRows,
      faqs: faqRows,
      reviews: reviewRows,
      certificates: certificateRows,
    });
  } catch (error) {
    if (error instanceof ContentDataError) {
      throw error;
    }
    throw new ContentDataError(error);
  }
}
