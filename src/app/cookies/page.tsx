import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/site/LegalDocumentPage";
import { COOKIE_POLICY_TITLE } from "@/modules/content/legal-copy";
import { getLandingPageData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: COOKIE_POLICY_TITLE,
  alternates: { canonical: "/cookies" },
};

export default async function CookiesPolicyPage() {
  const { legal } = await getLandingPageData();

  return (
    <LegalDocumentPage
      title={COOKIE_POLICY_TITLE}
      body={legal.cookiesConsentText}
      entityText={legal.entityText}
    />
  );
}
