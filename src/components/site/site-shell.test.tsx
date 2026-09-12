// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { QuickAccess } from "./QuickAccess";

afterEach(cleanup);

describe("public landing shell", () => {
  const data = getPreviewLandingData();

  it("links all quick cards to exact service anchors", () => {
    render(
      <QuickAccess items={data.quickLinks} services={data.services} />,
    );

    for (const item of data.quickLinks) {
      expect(
        screen.getByRole("link", {
          name: (accessibleName) => accessibleName.includes(item.label),
        }),
      ).toHaveAttribute("href", item.href);
    }
  });
});
