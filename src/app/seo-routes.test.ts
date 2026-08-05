import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/public", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "https://vibespace27.ru",
  }),
}));

import robots from "./robots";
import sitemap from "./sitemap";

describe("robots.txt metadata route", () => {
  it("allows public pages and points to sitemap", () => {
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
  it("lists public legal and landing URLs", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual([
      "https://vibespace27.ru",
      "https://vibespace27.ru/privacy",
      "https://vibespace27.ru/personal-data",
      "https://vibespace27.ru/cookies",
    ]);
  });
});
