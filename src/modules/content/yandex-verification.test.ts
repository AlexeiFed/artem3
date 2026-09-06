import { describe, expect, it } from "vitest";

import { AnalyticsSettingsSchema } from "./content.schemas";
import {
  buildYandexVerificationHtmlFile,
  extractYandexVerificationContent,
} from "./yandex-verification";

const YANDEX_HTML_FILE = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: e071a1e968e00937</body>
</html>`;

describe("extractYandexVerificationContent", () => {
  it("takes Verification: from a Yandex HTML file, not Content-Type", () => {
    expect(extractYandexVerificationContent(YANDEX_HTML_FILE)).toBe(
      "e071a1e968e00937",
    );
  });

  it("takes content from a yandex-verification meta tag", () => {
    expect(
      extractYandexVerificationContent(
        `<meta name="yandex-verification" content="abc_123-XYZ" />`,
      ),
    ).toBe("abc_123-XYZ");
  });

  it("takes content when it appears before name in the meta tag", () => {
    expect(
      extractYandexVerificationContent(
        `<meta content="token42" name="yandex-verification">`,
      ),
    ).toBe("token42");
  });

  it("keeps a raw token", () => {
    expect(extractYandexVerificationContent("  e071a1e968e00937  ")).toBe(
      "e071a1e968e00937",
    );
  });

  it("does not treat a Content-Type charset as the token", () => {
    expect(
      extractYandexVerificationContent(
        `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">`,
      ),
    ).toBe(
      `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">`,
    );
  });
});

describe("AnalyticsSettingsSchema yandex verification", () => {
  it("accepts a pasted Yandex HTML file and stores the token", () => {
    const parsed = AnalyticsSettingsSchema.parse({
      metrikaCounterId: "",
      yandexVerificationContent: YANDEX_HTML_FILE,
    });

    expect(parsed.yandexVerificationContent).toBe("e071a1e968e00937");
  });

  it("rejects a Content-Type meta without a verification token", () => {
    const parsed = AnalyticsSettingsSchema.safeParse({
      metrikaCounterId: "",
      yandexVerificationContent:
        `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">`,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("buildYandexVerificationHtmlFile", () => {
  it("renders the Webmaster HTML file body", () => {
    expect(buildYandexVerificationHtmlFile("e071a1e968e00937")).toContain(
      "Verification: e071a1e968e00937",
    );
  });
});
