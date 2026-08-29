// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { HonestyBanner, Workflow } from "./ContentSections";

vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation(
    (query: string): Partial<MediaQueryList> => ({
      matches: query.includes("min-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  ),
);

afterEach(cleanup);

describe("Workflow", () => {
  it("omits the eyebrow when it is empty", () => {
    const data = getPreviewLandingData();

    render(
      <Workflow
        consultation={data.consultation}
        workflow={{ ...data.workflow, eyebrow: "" }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: data.workflow.title }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll(".eyebrow")).toHaveLength(1);
  });
});

describe("HonestyBanner", () => {
  it("omits the eyebrow when it is empty", () => {
    const data = getPreviewLandingData();

    render(<HonestyBanner data={{ ...data.honesty, theme: "" }} />);

    expect(
      screen.getByRole("heading", { level: 2, name: data.honesty.title }),
    ).toBeInTheDocument();
    expect(document.querySelector(".eyebrow")).not.toBeInTheDocument();
  });
});
