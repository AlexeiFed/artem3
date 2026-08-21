import { describe, expect, it, vi } from "vitest";

const getPublicEnvMock = vi.fn(() => ({
  NEXT_PUBLIC_SITE_URL: "https://vibespace27.ru",
  NEXT_PUBLIC_ALLOW_INDEXING: false,
}));

vi.mock("@/lib/env/public", () => ({
  getPublicEnv: () => getPublicEnvMock(),
}));

import robots from "./robots";
import sitemap from "./sitemap";

describe("robots.txt metadata route", () => {
  it("blocks all crawlers when indexing is disabled", () => {
    getPublicEnvMock.mockReturnValue({
      NEXT_PUBLIC_SITE_URL: "https://vibespace27.ru",
      NEXT_PUBLIC_ALLOW_INDEXING: false,
    });

    const result = robots();

    expect(result.host).toBeUndefined();
    expect(result.sitemap).toBeUndefined();
    expect(result.rules).toEqual([
      {
        userAgent: "*",
        disallow: "/",
      },
    ]);
  });

  it("allows public pages and points to sitemap when indexing is enabled", () => {
    getPublicEnvMock.mockReturnValue({
      NEXT_PUBLIC_SITE_URL: "https://vibespace27.ru",
      NEXT_PUBLIC_ALLOW_INDEXING: true,
    });

    const result = robots();

    expect(result.host).toBe("https://vibespace27.ru");
    expect(result.sitemap).toBe("https://vibespace27.ru/sitemap.xml");
    expect(result.rules).toEqual([
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ]);
  });
});

describe("sitemap.xml metadata route", () => {
  it("returns empty list when indexing is disabled", () => {
    getPublicEnvMock.mockReturnValue({
      NEXT_PUBLIC_SITE_URL: "https://vibespace27.ru",
      NEXT_PUBLIC_ALLOW_INDEXING: false,
    });

    expect(sitemap()).toEqual([]);
  });

  it("lists public legal and landing URLs when indexing is enabled", () => {
    getPublicEnvMock.mockReturnValue({
      NEXT_PUBLIC_SITE_URL: "https://vibespace27.ru",
      NEXT_PUBLIC_ALLOW_INDEXING: true,
    });

    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual([
      "https://vibespace27.ru",
      "https://vibespace27.ru/privacy",
      "https://vibespace27.ru/personal-data",
      "https://vibespace27.ru/cookies",
      "https://vibespace27.ru/usloviya",
    ]);
  });
});
