// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { FloatingActions } from "./Contacts";
import { Faq } from "./Faq";

afterEach(cleanup);

describe("contact and FAQ presentation", () => {
  it("shows a phone icon on the floating contact button", () => {
    const { contacts } = getPreviewLandingData();
    render(
      <ModalProvider metrikaId={undefined}>
        <FloatingActions contacts={contacts} />
      </ModalProvider>,
    );

    expect(screen.getByTestId("phone-fab-icon")).toBeInTheDocument();
  });

  it("renders the personal FAQ invite below the accordion", () => {
    const data = getPreviewLandingData();
    const { container } = render(
      <ModalProvider metrikaId={undefined}>
        <Faq items={data.faqs} />
      </ModalProvider>,
    );

    const section = container.querySelector("#faq");
    const list = section?.querySelector(".faq-list");
    const invite = section?.querySelector(".faq-invite");
    expect(list).not.toBeNull();
    expect(invite).not.toBeNull();
    expect(
      Boolean(
        list &&
          invite &&
          Boolean(list.compareDocumentPosition(invite) & Node.DOCUMENT_POSITION_FOLLOWING),
      ),
    ).toBe(true);
    expect(
      screen.getByRole("heading", {
        name: "Не нашли ответ на свой случай?",
      }),
    ).toBeVisible();
  });
});
