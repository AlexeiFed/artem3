import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
};

export default async function PersonalDataConsentPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title="Согласие на обработку персональных данных"
      body={legal.personalDataText}
      entityText={legal.entityText}
    />
  );
}
