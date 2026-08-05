// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Header } from "./Header";

afterEach(cleanup);

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
});
