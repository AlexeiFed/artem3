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
  const clientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight",
  );
  const scrollHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollHeight",
  );

  afterEach(() => {
    if (clientHeight) {
      Object.defineProperty(HTMLElement.prototype, "clientHeight", clientHeight);
    } else {
      delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
    }
    if (scrollHeight) {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", scrollHeight);
    } else {
      delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
    }
  });

  function mockQuoteOverflow(overflows: boolean) {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return this instanceof HTMLElement &&
          this.classList.contains("review-quote")
          ? 80
          : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        if (
          !(this instanceof HTMLElement) ||
          !this.classList.contains("review-quote")
        ) {
          return 0;
        }
        return overflows ? 200 : 80;
      },
    });
  }

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

  it("clamps a long review to four lines and expands it from Читать далее", () => {
    const data = getPreviewLandingData();
    const [sample] = data.reviews;
    if (!sample) throw new Error("Reviews fixture is empty");
    mockQuoteOverflow(true);

    render(
      <Reviews
        ratings={data.ratings}
        reviews={[sample]}
        certificates={data.certificates}
      />,
    );

    const quote = screen.getByText(`«${sample.quote}»`);
    expect(quote).toHaveAttribute("data-expanded", "false");
    expect(quote).toHaveClass("review-quote");
    const toggle = screen.getByRole("button", { name: "Читать далее" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "review-quote-0");

    fireEvent.click(toggle);

    expect(quote).toHaveAttribute("data-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Свернуть" }),
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: "Свернуть" }));
    expect(quote).toHaveAttribute("data-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Читать далее" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("does not show Читать далее when the quote fits in four lines", () => {
    const data = getPreviewLandingData();
    const [sample] = data.reviews;
    if (!sample) throw new Error("Reviews fixture is empty");
    mockQuoteOverflow(false);

    render(
      <Reviews
        ratings={data.ratings}
        reviews={[sample]}
        certificates={data.certificates}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Читать далее" }),
    ).not.toBeInTheDocument();
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
