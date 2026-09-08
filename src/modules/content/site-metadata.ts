import type { Metadata } from "next";

export const SITE_TITLE = "Артём Сысуев — семейный и имущественный юрист";

export const SITE_DESCRIPTION =
  "Юрист по семейным и имущественным спорам в Хабаровске: развод, алименты, раздел имущества и споры о детях. Оценю перспективы дела.";

const OG_IMAGE_PATH = "/media/artem-hero-poster.jpg";

export interface SiteMetadataInput {
  siteUrl: string;
  allowIndexing: boolean;
  yandexVerificationContent: string;
  canonicalPath?: string;
  title?: string;
  description?: string;
}

export function buildSiteMetadata({
  siteUrl,
  allowIndexing,
  yandexVerificationContent,
  canonicalPath = "/",
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
}: SiteMetadataInput): Metadata {
  return {
    metadataBase: new URL(siteUrl.replace(/\/$/u, "")),
    title: {
      default: title,
      template: "%s — Артём Сысуев",
    },
    description,
    alternates: { canonical: canonicalPath },
    robots: allowIndexing
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: "/",
      siteName: SITE_TITLE,
      title,
      description,
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
    ...(yandexVerificationContent
      ? { verification: { yandex: yandexVerificationContent } }
      : {}),
  };
}
