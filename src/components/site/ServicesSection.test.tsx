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

  it("renders every service CTA as a solid button, not an underlined link", () => {
    const data = getPreviewLandingData();

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection services={data.services} intro={data.servicesIntro} />
      </ModalProvider>,
    );

    const ctas = document.querySelectorAll(".service-card aside .service-cta");
    expect(ctas).toHaveLength(data.services.length);
    for (const cta of ctas) {
      expect(cta).toHaveClass("button");
      expect(cta.textContent).not.toContain("→");
      expect(cta.querySelector("svg.service-cta-arrow")).not.toBeNull();
    }
    expect(document.querySelector(".text-button")).not.toBeInTheDocument();
  });

  it("labels the situations list and capitalises the price prefix", () => {
    const data = getPreviewLandingData();
    const first = data.services[0];
    expect(first).toBeDefined();

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection services={data.services} intro={data.servicesIntro} />
      </ModalProvider>,
    );

    expect(
      document.querySelectorAll(".service-list-label"),
    ).toHaveLength(data.services.length);
    expect(
      screen.getAllByText("Краткий список ситуаций")[0],
    ).toBeInTheDocument();

    const price = document.querySelector(".service-card .price");
    expect(price?.textContent).toMatch(/^От\s/u);
  });

  it("gives every service its own icon instead of repeating the scales", () => {
    const data = getPreviewLandingData();

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection services={data.services} intro={data.servicesIntro} />
      </ModalProvider>,
    );

    const icons = document.querySelectorAll(".service-card aside .service-icon");
    expect(icons).toHaveLength(data.services.length);
    expect(document.querySelector(".justice-scales")).not.toBeInTheDocument();

    const shapes = new Set(
      Array.from(icons, (icon) => icon.innerHTML),
    );
    expect(shapes.size).toBe(data.services.length);
  });

  it("renders an uploaded icon image instead of the built-in svg", () => {
    const data = getPreviewLandingData();
    const first = data.services[0];
    if (!first) throw new Error("Missing service fixture");
    const services = [
      { ...first, iconUrl: "/media/custom-service-icon.png" },
      ...data.services.slice(1),
    ];

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection services={services} intro={data.servicesIntro} />
      </ModalProvider>,
    );

    const uploaded = document.querySelector(
      ".service-card aside img.service-icon",
    );
    expect(uploaded).toHaveAttribute("src", "/media/custom-service-icon.png");
    expect(uploaded).toHaveAttribute("alt", "");
  });

  it("places the service index above the title inside the text column", () => {
    const data = getPreviewLandingData();

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection services={data.services} intro={data.servicesIntro} />
      </ModalProvider>,
    );

    const main = document.querySelector(".service-card .service-main");
    const number = main?.querySelector(":scope > .service-number");
    const title = main?.querySelector(":scope > h3");
    expect(number?.textContent).toBe("01");
    expect(main?.firstElementChild).toBe(number);
    expect(number?.nextElementSibling).toBe(title);
    expect(
      document.querySelector(".service-card > .service-number"),
    ).toBeNull();
  });

  it("marks the trust note with an inline notice cue", () => {
    const data = getPreviewLandingData();

    render(
      <ModalProvider metrikaId={undefined}>
        <ServicesSection services={data.services} intro={data.servicesIntro} />
      </ModalProvider>,
    );

    const mark = document.querySelector(
      ".service-card aside .service-trust-mark",
    );
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark?.textContent).toBe("!");
    expect(mark?.parentElement?.textContent).toMatch(/^!\s*Важно/u);
  });
});
