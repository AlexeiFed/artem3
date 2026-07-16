import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: "Согласие на обработку файлов cookies",
};

export default async function CookiesConsentPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title="Согласие на обработку файлов cookies"
      body={legal.cookiesConsentText}
      entityText={legal.entityText}
    />
  );
}
