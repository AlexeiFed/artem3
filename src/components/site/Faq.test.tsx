// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Faq } from "./Faq";

afterEach(cleanup);

describe("Faq", () => {
  it("toggles aria-expanded and answer visibility", () => {
    const [item] = getPreviewLandingData().faqs;
    if (!item) throw new Error("FAQ fixture is empty");

    render(<Faq items={[item]} />);
    const trigger = screen.getByRole("button", { name: item.question });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(item.answer)).toBeVisible();
  });
});
