// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Hero } from "./Hero";

let reducedMotion = false;
vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation(
    (query: string): Partial<MediaQueryList> => ({
      matches: query.includes("prefers-reduced-motion") && reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  ),
);

afterEach(() => {
  cleanup();
  reducedMotion = false;
  vi.mocked(HTMLVideoElement.prototype.play).mockRestore();
});

beforeEach(() => {
  vi.spyOn(HTMLVideoElement.prototype, "play").mockResolvedValue(
    undefined as unknown as void,
  );
});

function renderHero() {
  const data = getPreviewLandingData().hero;
  return {
    data,
    ...render(
      <ModalProvider metrikaId={undefined}>
        <Hero data={data} />
      </ModalProvider>,
    ),
  };
}

describe("Hero", () => {
  it("keeps server markup poster-only for hydration safety", () => {
    const html = renderToString(
      <Hero data={getPreviewLandingData().hero} />,
    );

    expect(html).not.toContain('data-testid="hero-video"');
    expect(html).toContain('data-testid="hero-poster"');
  });

  it("renders the approved heading, CTA and consultation note", () => {
    renderHero();

    expect(
      screen.getByRole("heading", {
        name: "Развод, алименты и раздел имущества в Хабаровске",
      }),
    ).toBeVisible();
    const cta = screen.getByRole("button", {
      name: "Получить оценку ситуации",
    });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveClass("button");
    expect(cta).not.toHaveClass("button-light");
    expect(
      screen.getByText("Опишите ваш вопрос — оценю перспективы и подскажу возможные действия.", {
        exact: false,
      }),
    ).toBeVisible();
  });

  it("renders all three proof metrics", () => {
    renderHero();

    const metrics = screen.getByRole("list", {
      name: "Практика в цифрах",
    });
    expect(metrics).toHaveTextContent("11+");
    expect(metrics).toHaveTextContent("380+");
    expect(metrics).toHaveTextContent("скрытых платежей");
    expect(metrics).toHaveTextContent("клиентов получили помощь");
    expect(
      Array.from(
        metrics.querySelectorAll<HTMLElement>(".hero-metric-content"),
      ).map((item) => item.style.opacity),
    ).toEqual(["0", "0", "0"]);
  });

  it("starts muted playback after hydration", () => {
    renderHero();

    expect(HTMLVideoElement.prototype.play).toHaveBeenCalled();
  });

  it("renders the local muted looping video without VK or sound controls", () => {
    const { data } = renderHero();
    const video = screen.getByTestId("hero-video");

    expect(video).toHaveAttribute("src", data.video.fallbackUrl);
    expect(video).toHaveAttribute("poster", data.video.posterUrl);
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "auto");
    expect(video).toHaveAttribute("muted");
    expect(video).toHaveProperty("muted", true);
    expect(screen.queryByTitle(/VK-плеер/u)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /звук/u }),
    ).not.toBeInTheDocument();
  });

  it("keeps the poster when video loading fails", () => {
    renderHero();

    fireEvent.error(screen.getByTestId("hero-video"));

    expect(screen.getByTestId("hero-video")).toHaveAttribute(
      "data-video-failed",
      "true",
    );
    expect(screen.getByTestId("hero-poster")).toBeVisible();
  });

  it("uses the abstract fallback when the poster fails", () => {
    renderHero();

    fireEvent.error(screen.getByTestId("hero-poster"));

    expect(screen.queryByTestId("hero-poster")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-abstract")).toBeVisible();
  });

  it("uses poster-only mode for reduced motion", () => {
    reducedMotion = true;
    renderHero();

    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-stage")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    expect(screen.getByTestId("hero-poster")).toBeVisible();
  });

  it("opens the existing lead modal from the CTA", () => {
    renderHero();

    fireEvent.click(
      screen.getByRole("button", { name: "Получить оценку ситуации" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Обсудить ваш вопрос" }),
    ).toBeVisible();
  });
});
