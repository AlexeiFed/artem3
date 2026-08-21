// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
  COOKIE_CONSENT_KEY,
  acceptCookieConsent,
  readCookieConsent,
  subscribeCookieConsent,
} from "./cookie-consent";

afterEach(() => {
  localStorage.clear();
});

describe("cookie consent store", () => {
  it("starts without consent and notifies same-tab subscribers on accept", () => {
    expect(readCookieConsent()).toBe(false);

    let notified = 0;
    const unsubscribe = subscribeCookieConsent(() => {
      notified += 1;
    });

    acceptCookieConsent();

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("1");
    expect(readCookieConsent()).toBe(true);
    expect(notified).toBe(1);

    unsubscribe();
  });
});
