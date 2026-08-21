// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { COOKIE_CONSENT_KEY, acceptCookieConsent } from "@/lib/cookie-consent";

import { ConsentGatedMetrika } from "./ConsentGatedMetrika";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ConsentGatedMetrika", () => {
  it("does not mount Metrika before cookie consent", () => {
    render(<ConsentGatedMetrika counterId={123} />);
    expect(document.getElementById("yandex-metrika")).toBeNull();
  });

  it("mounts Metrika after cookie consent", async () => {
    render(<ConsentGatedMetrika counterId={123} />);
    acceptCookieConsent();

    await waitFor(() => {
      expect(document.getElementById("yandex-metrika")).not.toBeNull();
    });
  });

  it("mounts Metrika when consent is already stored", async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    render(<ConsentGatedMetrika counterId={123} />);

    await waitFor(() => {
      expect(document.getElementById("yandex-metrika")).not.toBeNull();
    });
  });
});
