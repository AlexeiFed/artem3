// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Contacts, FloatingActions } from "./Contacts";
import { Faq } from "./Faq";

let observerCallback: IntersectionObserverCallback | null = null;
const observedTargets: Element[] = [];

class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  observe(target: Element) {
    observedTargets.push(target);
  }

  unobserve() {}

  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

afterEach(() => {
  observerCallback = null;
  observedTargets.length = 0;
  cleanup();
});

function emitIntersection(isIntersecting: boolean) {
  const target =
    observedTargets.find((element) => element.id === "contacts") ??
    document.createElement("section");
  observerCallback?.(
    [
      {
        isIntersecting,
        intersectionRatio: isIntersecting ? 0.4 : 0,
        target,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0,
      },
    ],
    {} as IntersectionObserver,
  );
}

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

  it("hides the contact rail while the contacts section is in view", async () => {
    const data = getPreviewLandingData();
    render(
      <ModalProvider metrikaId={undefined}>
        <Contacts
          contacts={data.contacts}
          legal={data.legal}
          yandexMapsApiKey={undefined}
        />
        <FloatingActions contacts={data.contacts} />
      </ModalProvider>,
    );

    const rail = screen.getByRole("navigation", { name: "Быстрая связь" });
    expect(rail).not.toHaveClass("is-hidden");
    expect(rail).not.toHaveAttribute("aria-hidden", "true");
    expect(observedTargets.some((element) => element.id === "contacts")).toBe(
      true,
    );

    emitIntersection(true);
    await waitFor(() => {
      expect(rail).toHaveClass("is-hidden");
      expect(rail).toHaveAttribute("aria-hidden", "true");
    });

    emitIntersection(false);
    await waitFor(() => {
      expect(rail).not.toHaveClass("is-hidden");
      expect(rail).not.toHaveAttribute("aria-hidden", "true");
    });
  });
});
