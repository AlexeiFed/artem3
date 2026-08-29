// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import { LEGAL_TEXT_VERSION } from "@/modules/content/legal-copy";

import {
  COOKIE_CONSENT_KEY,
  acceptCookieConsent,
  readCookieConsent,
} from "./cookie-consent";

afterEach(() => {
  localStorage.clear();
});

describe("cookie consent storage", () => {
  it("treats legacy unversioned consent as missing so a new policy can re-prompt", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    expect(readCookieConsent()).toBe(false);
  });

  it("accepts only the current legal text version", () => {
    acceptCookieConsent();
    expect(JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) ?? "")).toEqual({
      version: LEGAL_TEXT_VERSION,
    });
    expect(readCookieConsent()).toBe(true);

    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ version: "01.01.2020" }),
    );
    expect(readCookieConsent()).toBe(false);
  });
});
