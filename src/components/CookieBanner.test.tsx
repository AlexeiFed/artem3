// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CookieBanner, COOKIE_CONSENT_KEY } from "./CookieBanner";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

describe("CookieBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("appears after delay when consent is missing and dismisses on OK", async () => {
    vi.useFakeTimers();
    render(<CookieBanner />);

    expect(
      screen.queryByRole("region", { name: /использование cookie/i }),
    ).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    const banner = screen.getByRole("region", {
      name: /использование cookie/i,
    });
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Яндекс\.Карты/);
    expect(
      screen.getByRole("link", { name: /политике cookie/i }),
    ).toHaveAttribute("href", "/cookies");

    fireEvent.click(screen.getByRole("button", { name: "ОК" }));
    expect(JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) ?? "")).toEqual({
      version: "22.08.2026",
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(
      screen.queryByRole("region", { name: /использование cookie/i }),
    ).toBeNull();
  });

  it("does not render when consent already stored", () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ version: "22.08.2026" }),
    );
    render(<CookieBanner />);
    expect(
      screen.queryByRole("region", { name: /использование cookie/i }),
    ).toBeNull();
  });
});
