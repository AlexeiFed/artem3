import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";

import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { CookieBanner } from "@/components/CookieBanner";
import { ModalProvider } from "@/components/forms/ModalProvider";
import { LenisProvider } from "@/components/motion/LenisProvider";
import {
  designTokenCssVariables,
  type DesignTokenCssVariables,
} from "@/lib/design-tokens";
import { getPublicEnv } from "@/lib/env/public";
import { getPublicAnalytics } from "@/modules/content/public-analytics";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const rootStyle: CSSProperties & DesignTokenCssVariables = {
  ...designTokenCssVariables,
};

export async function generateMetadata(): Promise<Metadata> {
  const analytics = await getPublicAnalytics();
  const allowIndexing = getPublicEnv().NEXT_PUBLIC_ALLOW_INDEXING;

  return {
    title: {
      default: "Артём Сысуев — семейный и имущественный юрист",
      template: "%s — Артём Сысуев",
    },
    description:
      "Юридическая помощь по семейным и имущественным спорам в Хабаровске.",
    robots: allowIndexing
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    ...(analytics.yandexVerificationContent
      ? {
          verification: {
            yandex: analytics.yandexVerificationContent,
          },
        }
      : {}),
  };
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const analytics = await getPublicAnalytics();
  const metrikaId = analytics.metrikaId;

  return (
    <html
      lang="ru"
      className={`${cormorant.variable} ${inter.variable}`}
      style={rootStyle}
    >
      <body>
        {metrikaId ? <YandexMetrika counterId={metrikaId} /> : null}
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
