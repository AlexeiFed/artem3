import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
};

export default async function PrivacyPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title="Политика конфиденциальности"
      body={legal.privacyText}
      entityText={legal.entityText}
    />
  );
}
