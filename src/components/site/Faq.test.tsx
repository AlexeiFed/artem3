// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Faq } from "./Faq";

afterEach(cleanup);

describe("Faq", () => {
  it("toggles aria-expanded and answer visibility", () => {
    const [item] = getPreviewLandingData().faqs;
    if (!item) throw new Error("FAQ fixture is empty");

    render(
      <ModalProvider metrikaId={undefined}>
        <Faq items={[item]} />
      </ModalProvider>,
    );
    const trigger = screen.getByRole("button", { name: item.question });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(item.answer)).toBeVisible();
  });
});
