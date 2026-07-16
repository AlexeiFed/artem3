import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";

import { CookieBanner } from "@/components/CookieBanner";
import { ModalProvider } from "@/components/forms/ModalProvider";
import { LenisProvider } from "@/components/motion/LenisProvider";
import {
  designTokenCssVariables,
  type DesignTokenCssVariables,
} from "@/lib/design-tokens";
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

export const metadata: Metadata = {
  title: {
    default: "Артём Сысуев — семейный и имущественный юрист",
    template: "%s — Артём Сысуев",
  },
  description:
    "Юридическая помощь по семейным и имущественным спорам в Хабаровске.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const rootStyle: CSSProperties & DesignTokenCssVariables = {
  ...designTokenCssVariables,
};

export default function RootLayout({ children }: RootLayoutProps) {
  const metrikaValue = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);
  const metrikaId =
    Number.isInteger(metrikaValue) && metrikaValue > 0
      ? metrikaValue
      : undefined;

  return (
    <html
      lang="ru"
      className={`${cormorant.variable} ${inter.variable}`}
      style={rootStyle}
    >
      <body>
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
