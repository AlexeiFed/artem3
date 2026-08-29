import type { Metadata } from "next";

export const SITE_TITLE = "Артём Сысуев — семейный и имущественный юрист";

export const SITE_OG_TITLE =
  "Артём Сысуев — семейный и имущественный юрист в Хабаровске";

/** 130 символов — верхняя граница окна, которое поисковики показывают целиком. */
export const SITE_DESCRIPTION =
  "Юрист по семейным и имущественным спорам в Хабаровске: развод, алименты, раздел имущества и споры о детях. Оценю перспективы дела.";

const OG_IMAGE_PATH = "/media/artem-hero-poster.jpg";

export interface SiteMetadataInput {
  siteUrl: string;
  allowIndexing: boolean;
  yandexVerificationContent: string;
  canonicalPath?: string;
}

export function buildSiteMetadata({
  siteUrl,
  allowIndexing,
  yandexVerificationContent,
  canonicalPath = "/",
}: SiteMetadataInput): Metadata {
  return {
    metadataBase: new URL(siteUrl.replace(/\/$/u, "")),
    title: {
      default: SITE_TITLE,
      template: "%s — Артём Сысуев",
    },
    description: SITE_DESCRIPTION,
    alternates: { canonical: canonicalPath },
    robots: allowIndexing
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: "/",
      siteName: SITE_TITLE,
      title: SITE_OG_TITLE,
      description: SITE_DESCRIPTION,
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_OG_TITLE,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE_PATH],
    },
    ...(yandexVerificationContent
      ? { verification: { yandex: yandexVerificationContent } }
      : {}),
  };
}
