import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { PERSONAL_DATA_PROCESSING_POLICY_TITLE } from "@/modules/content/legal-copy";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: PERSONAL_DATA_PROCESSING_POLICY_TITLE,
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title={PERSONAL_DATA_PROCESSING_POLICY_TITLE}
      body={legal.privacyText}
      entityText={legal.entityText}
    />
  );
}
