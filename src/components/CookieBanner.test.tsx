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
      screen.queryByRole("dialog", { name: /использование cookie/i }),
    ).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    const banner = screen.getByRole("dialog", {
      name: /использование cookie/i,
    });
    expect(banner).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ОК" }));
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(
      screen.queryByRole("dialog", { name: /использование cookie/i }),
    ).toBeNull();
  });

  it("does not render when consent already stored", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    render(<CookieBanner />);
    expect(
      screen.queryByRole("dialog", { name: /использование cookie/i }),
    ).toBeNull();
  });
});
