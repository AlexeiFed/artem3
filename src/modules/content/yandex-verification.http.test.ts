import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import { createYandexVerificationFileHandler } from "./yandex-verification.http";

const TOKEN = "e071a1e968e00937";

describe("yandex verification HTML file HTTP", () => {
  it("returns the HTML file when the path token matches settings", async () => {
    const handler = createYandexVerificationFileHandler({
      loadVerificationContent: async () => TOKEN,
    });

    const response = await handler(new Request("https://example.test/yandex_e071a1e968e00937.html"), {
      params: Promise.resolve({ code: TOKEN }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=UTF-8");
    await expect(response.text()).resolves.toContain(`Verification: ${TOKEN}`);
  });

  it("returns 404 when the token does not match", async () => {
    const handler = createYandexVerificationFileHandler({
      loadVerificationContent: async () => TOKEN,
    });

    const response = await handler(new Request("https://example.test/yandex_other.html"), {
      params: Promise.resolve({ code: "other" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when verification is not configured", async () => {
    const handler = createYandexVerificationFileHandler({
      loadVerificationContent: async () => "",
    });

    const response = await handler(
      new Request("https://example.test/yandex_e071a1e968e00937.html"),
      { params: Promise.resolve({ code: TOKEN }) },
    );

    expect(response.status).toBe(404);
  });
});

describe("yandex verification rewrite", () => {
  it("maps /yandex_{token}.html to the verification route", async () => {
    const rewrites = nextConfig.rewrites;
    expect(rewrites).toEqual(expect.any(Function));
    if (!rewrites) {
      throw new Error("expected rewrites()");
    }

    const rules = await rewrites();
    expect(rules).toEqual(
      expect.arrayContaining([
        {
          source: "/yandex_:code.html",
          destination: "/api/yandex-verification/:code",
        },
      ]),
    );
  });
});
