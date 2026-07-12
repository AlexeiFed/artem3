// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Hero } from "./Hero";
import { QuickAccess } from "./QuickAccess";

afterEach(cleanup);

describe("public landing shell", () => {
  const data = getPreviewLandingData();

  it("renders the exact hero heading and CTA", () => {
    render(<Hero data={data.hero} />);

    expect(
      screen.getByRole("heading", {
        name: "Развод, алименты и раздел имущества в Хабаровске",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Получить консультацию" }),
    ).toBeVisible();
  });

  it("links all quick cards to exact service anchors", () => {
    render(<QuickAccess items={data.quickLinks} />);

    for (const item of data.quickLinks) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });
});
