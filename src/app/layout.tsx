import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";

import { ConsentGatedMetrika } from "@/components/analytics/ConsentGatedMetrika";
import { CookieBanner } from "@/components/CookieBanner";
import { ModalProvider } from "@/components/forms/ModalProvider";
import { LenisProvider } from "@/components/motion/LenisProvider";
import {
  designTokens,
  designTokenCssVariables,
  type DesignTokenCssVariables,
} from "@/lib/design-tokens";
import { getPublicEnv } from "@/lib/env/public";
import { getPublicAnalytics } from "@/modules/content/public-analytics";
import { getPublicSeo } from "@/modules/content/public-seo";
import { buildSiteMetadata } from "@/modules/content/site-metadata";
import "./fonts";
import "./globals.css";

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const rootStyle: CSSProperties & DesignTokenCssVariables = {
  ...designTokenCssVariables,
};

export async function generateMetadata(): Promise<Metadata> {
  const [analytics, seo] = await Promise.all([
    getPublicAnalytics(),
    getPublicSeo(),
  ]);
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_ALLOW_INDEXING } = getPublicEnv();

  return buildSiteMetadata({
    siteUrl: NEXT_PUBLIC_SITE_URL,
    allowIndexing: NEXT_PUBLIC_ALLOW_INDEXING,
    yandexVerificationContent: analytics.yandexVerificationContent,
    title: seo.title,
    description: seo.description,
    ogSiteName: seo.ogSiteName,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
  });
}

export const viewport: Viewport = {
  themeColor: designTokens.color.accentForest,
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const analytics = await getPublicAnalytics();
  const metrikaId = analytics.metrikaId;

  return (
    <html lang="ru" style={rootStyle}>
      <body>
        {metrikaId ? <ConsentGatedMetrika counterId={metrikaId} /> : null}
        <LenisProvider>
          <ModalProvider metrikaId={metrikaId}>
            {children}
            <CookieBanner />
          </ModalProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
