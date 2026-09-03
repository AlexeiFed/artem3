// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { HonestyBanner, Reviews, Workflow } from "./ContentSections";

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

describe("Reviews", () => {
  it("shows next/prev arrows when needed and one dot per review", () => {
    const data = getPreviewLandingData();
    HTMLElement.prototype.scrollIntoView = vi.fn();

    render(
      <Reviews
        ratings={data.ratings}
        reviews={data.reviews}
        certificates={data.certificates}
      />,
    );

    expect(screen.queryByRole("button", { name: "Предыдущий отзыв" })).toBeNull();
    expect(screen.getByRole("button", { name: "Следующий отзыв" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Показать отзыв/ })).toHaveLength(
      data.reviews.length,
    );

    fireEvent.click(screen.getByRole("button", { name: "Следующий отзыв" }));

    expect(
      screen.getByRole("button", { name: "Предыдущий отзыв" }),
    ).toBeInTheDocument();
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
