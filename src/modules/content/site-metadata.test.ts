import { describe, expect, it } from "vitest";

import { SITE_DESCRIPTION, buildSiteMetadata } from "./site-metadata";

const SITE_URL = "https://example.test";

describe("buildSiteMetadata", () => {
  it("keeps the default description within 320 characters", () => {
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(320);
  });

  it("uses admin Title and Description for the document and Open Graph tags", () => {
    const title =
      "Семейный юрист в Хабаровске — Артём Сысуев | Развод, алименты, раздел имущества, споры о детях";
    const description =
      "Семейный и имущественный юрист в Хабаровске. 11+ лет практики, более 380 клиентов получили помощь. Стоимость работы известна заранее. Ответ в течение 1 часа в рабочее время.";

    const metadata = buildSiteMetadata({
      siteUrl: SITE_URL,
      allowIndexing: true,
      yandexVerificationContent: "",
      title,
      description,
    });

    expect(metadata.title).toEqual({
      default: title,
      template: "%s — Артём Сысуев",
    });
    expect(metadata.description).toBe(description);
    expect(metadata.openGraph?.title).toBe(title);
    expect(metadata.openGraph?.description).toBe(description);
  });

  it("blocks indexing and still exposes a shareable Open Graph card", () => {
    const metadata = buildSiteMetadata({
      siteUrl: SITE_URL,
      allowIndexing: false,
      yandexVerificationContent: "",
    });

    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
    });
    expect(String(metadata.metadataBase)).toBe(`${SITE_URL}/`);
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.description).toBe(SITE_DESCRIPTION);
    expect(metadata.verification).toBeUndefined();
  });

  it("lets a page override the canonical path so legal URLs are not homepage duplicates", () => {
    const metadata = buildSiteMetadata({
      siteUrl: SITE_URL,
      allowIndexing: true,
      yandexVerificationContent: "",
      canonicalPath: "/privacy",
    });

    expect(metadata.alternates?.canonical).toBe("/privacy");
  });

  it("opens indexing and keeps Yandex verification when enabled", () => {
    const metadata = buildSiteMetadata({
      siteUrl: SITE_URL,
      allowIndexing: true,
      yandexVerificationContent: "abc123",
    });

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.verification?.yandex).toBe("abc123");
  });

  it("tolerates a trailing slash in the configured site URL", () => {
    const metadata = buildSiteMetadata({
      siteUrl: `${SITE_URL}/`,
      allowIndexing: false,
      yandexVerificationContent: "",
    });

    expect(String(metadata.metadataBase)).toBe(`${SITE_URL}/`);
  });
});
