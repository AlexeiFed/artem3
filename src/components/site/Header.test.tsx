// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Header } from "./Header";

afterEach(() => {
  cleanup();
  document.getElementById("main")?.remove();
  vi.unstubAllGlobals();
});

function renderHeader(hoursNote?: string) {
  const data = getPreviewLandingData();
  return {
    data,
    ...render(
      <ModalProvider metrikaId={undefined}>
        <Header
          data={data.header}
          address={data.contacts.address}
          workHours={data.contacts.workHours}
          hoursNote={hoursNote ?? data.contacts.hoursNote}
          phone={data.contacts.phone}
          serviceLinks={data.quickLinks}
        />
      </ModalProvider>,
    ),
  };
}

describe("Header", () => {
  it("keeps desktop header-meta in the bar for large screens", () => {
    renderHeader();

    const meta = document.querySelector(".header-inner .header-meta");
    expect(meta).toBeTruthy();
    expect(meta).toHaveTextContent("г. Хабаровск, ул. Ленина, 22, офис 12");
    expect(meta).toHaveTextContent("Пн–Пт, 09:00–18:00");
  });

  it("keeps spaces between logo, address, hours and note for crawlers", () => {
    renderHeader();

    expect(document.querySelector(".header-inner .logo")?.textContent).toBe(
      "Артём Сысуев Семейный юрист",
    );
    expect(
      document.querySelector(".header-inner .header-meta")?.textContent,
    ).toBe(
      "г. Хабаровск, ул. Ленина, 22, офис 12 Пн–Пт, 09:00–18:00 (по предварительной записи)",
    );
  });

  it("shows address, work hours and note inside the mobile menu sheet", () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

    expect(document.querySelector(".mobile-menu-panel")).toBeTruthy();
    const meta = document.querySelector(".mobile-menu-meta");
    expect(meta).toBeTruthy();
    expect(meta).toHaveTextContent("г. Хабаровск, ул. Ленина, 22, офис 12");
    expect(meta).toHaveTextContent("Пн–Пт, 09:00–18:00");
    expect(meta).toHaveTextContent("(по предварительной записи)");
  });

  it("hides hours note in the menu when empty", () => {
    renderHeader("");

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

    expect(
      screen.queryByText("(по предварительной записи)"),
    ).not.toBeInTheDocument();
  });

  it("lists service links under the services nav item", () => {
    renderHeader();

    expect(
      screen.getByRole("menuitem", { name: "Расторжение брака" }),
    ).toHaveAttribute("href", "#razvod");
    expect(screen.getByRole("menuitem", { name: "Алименты" })).toHaveAttribute(
      "href",
      "#alimenty",
    );
  });

  it("exposes services dropdown expanded state for assistive tech", () => {
    renderHeader();

    const trigger = document.querySelector(".nav-dropdown > a");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    const dropdown = trigger?.closest(".nav-dropdown");
    expect(dropdown).toBeTruthy();
    fireEvent.mouseEnter(dropdown!);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseLeave(dropdown!);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("puts a tap-to-call phone link in the header bar", () => {
    const { data } = renderHeader();

    const phoneLink = document.querySelector<HTMLAnchorElement>(
      ".header-inner .header-phone",
    );
    expect(phoneLink).toBeTruthy();
    expect(phoneLink).toHaveAttribute("href", data.contacts.phone.href);
    expect(phoneLink).toHaveTextContent(data.contacts.phone.display);
  });

  it("shows Главная in desktop nav and mobile menu", () => {
    renderHeader();

    const desktopNav = document.querySelector(".desktop-nav");
    expect(desktopNav).toBeTruthy();
    expect(
      desktopNav?.querySelector('a[href="#main"]'),
    ).toHaveTextContent("Главная");

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

    const mobileNav = document.querySelector(
      '[aria-label="Мобильная навигация"]',
    );
    expect(mobileNav).toBeTruthy();
    expect(
      mobileNav?.querySelector('a[href="#main"]'),
    ).toHaveTextContent("Главная");
  });

  it("hides the header CTA while the hero is on screen", () => {
    const hero = document.createElement("section");
    hero.id = "main";
    document.body.append(hero);

    let observerCallback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
        observe = observe;
        disconnect = vi.fn();
        unobserve = vi.fn();
        takeRecords = () => [];
        root = null;
        rootMargin = "";
        thresholds = [];
      },
    );

    renderHeader();
    expect(observe).toHaveBeenCalled();
    expect(document.querySelector(".site-header")).toHaveClass("is-over-hero");
    expect(document.querySelector(".header-cta")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    act(() => {
      observerCallback?.(
        [
          {
            isIntersecting: false,
            target: hero,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(document.querySelector(".site-header")).not.toHaveClass(
      "is-over-hero",
    );
    expect(document.querySelector(".header-cta")).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
