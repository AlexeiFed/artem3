import type { Metadata } from "next";

export const SITE_TITLE = "Артём Сысуев — семейный и имущественный юрист";

export const SITE_DESCRIPTION =
  "Юрист по семейным и имущественным спорам в Хабаровске: развод, алименты, раздел имущества и споры о детях. Оценю перспективы дела.";

export const OG_SITE_NAME = "Артём Сысуев — семейный юрист";

export const OG_TITLE =
  "Семейный юрист в Хабаровске — развод, алименты, раздел имущества";

export const OG_DESCRIPTION =
  "11+ лет практики, 380+ клиентов. Развод, алименты, раздел имущества, споры о детях. Ответ в течение 1 часа.";

const OG_IMAGE_PATH = "/media/artem-hero-poster.jpg";

export interface SiteMetadataInput {
  siteUrl: string;
  allowIndexing: boolean;
  yandexVerificationContent: string;
  canonicalPath?: string;
  title?: string;
  description?: string;
  ogSiteName?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function buildSiteMetadata({
  siteUrl,
  allowIndexing,
  yandexVerificationContent,
  canonicalPath = "/",
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  ogSiteName = OG_SITE_NAME,
  ogTitle = OG_TITLE,
  ogDescription = OG_DESCRIPTION,
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
      siteName: ogSiteName,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE_PATH],
    },
    ...(yandexVerificationContent
      ? { verification: { yandex: yandexVerificationContent } }
      : {}),
  };
}
