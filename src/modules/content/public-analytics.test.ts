import { describe, expect, it } from "vitest";

import { resolvePublicAnalytics } from "./resolve-public-analytics";

describe("resolvePublicAnalytics", () => {
  it("prefers DB metrika id over env", () => {
    expect(
      resolvePublicAnalytics(
        { metrikaCounterId: "12345678", yandexVerificationContent: "abc" },
        "999",
      ),
    ).toEqual({
      metrikaId: 12345678,
      yandexVerificationContent: "abc",
    });
  });

  it("falls back to env when DB counter is empty", () => {
    expect(
      resolvePublicAnalytics(
        { metrikaCounterId: "", yandexVerificationContent: "" },
        "555666",
      ),
    ).toEqual({
      metrikaId: 555666,
      yandexVerificationContent: "",
    });
  });

  it("ignores malformed DB payload", () => {
    expect(resolvePublicAnalytics({ metrikaCounterId: "not-a-number" }, "42")).toEqual(
      {
        metrikaId: 42,
        yandexVerificationContent: "",
      },
    );
  });
});
