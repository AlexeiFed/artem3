import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { PERSONAL_DATA_CONSENT_TITLE } from "@/modules/content/legal-copy";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: PERSONAL_DATA_CONSENT_TITLE,
  alternates: { canonical: "/personal-data" },
};

export default async function PersonalDataConsentPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title={PERSONAL_DATA_CONSENT_TITLE}
      body={legal.personalDataText}
      entityText={legal.entityText}
    />
  );
}
