// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { COOKIE_CONSENT_KEY, acceptCookieConsent } from "@/lib/cookie-consent";

import { ContactsMap } from "./ContactsMap";

const MAP_PROPS = {
  latitude: 48.470744,
  longitude: 135.074118,
  externalUrl: "https://yandex.ru/maps/",
  apiKey: "6e97c31d-b90e-4697-915a-958bace9b546",
  address: "г. Хабаровск, ул. Ленина, 22, офис 12",
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.getElementById("yandex-maps-api-2-1")?.remove();
});

describe("ContactsMap cookie gate", () => {
  it("does not load Yandex Maps script before cookie consent", () => {
    render(<ContactsMap {...MAP_PROPS} />);

    expect(document.getElementById("yandex-maps-api-2-1")).toBeNull();
    expect(
      screen.getByRole("link", { name: /яндекс картах/i }),
    ).toBeVisible();
  });

  it("loads Yandex Maps script after cookie consent", async () => {
    render(<ContactsMap {...MAP_PROPS} />);
    acceptCookieConsent();

    await waitFor(() => {
      expect(document.getElementById("yandex-maps-api-2-1")).not.toBeNull();
    });
  });

  it("loads Yandex Maps script when consent is already stored", async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    render(<ContactsMap {...MAP_PROPS} />);

    await waitFor(() => {
      expect(document.getElementById("yandex-maps-api-2-1")).not.toBeNull();
    });
  });
});
