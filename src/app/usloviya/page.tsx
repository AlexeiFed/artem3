import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: "Условия обращения через сайт",
  alternates: { canonical: "/usloviya" },
};

export default async function TermsPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title="Условия обращения через сайт"
      body={legal.termsText}
      entityText={legal.entityText}
    />
  );
}
