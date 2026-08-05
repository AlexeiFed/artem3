// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { ServicesSection } from "./ServicesSection";

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

afterEach(cleanup);

describe("ServicesSection", () => {
  it("does not highlight high-value services with a badge", () => {
    const data = getPreviewLandingData();
    const highValue = data.services.find((service) => service.isHighValue);
    expect(highValue).toBeDefined();

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection
          services={data.services}
          intro={data.servicesIntro}
        />
      </ModalProvider>,
    );

    expect(screen.queryByText("Высокий чек")).not.toBeInTheDocument();
    expect(
      document.querySelector(".service-card.high-value"),
    ).not.toBeInTheDocument();
  });
});
