// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Header } from "./Header";

afterEach(cleanup);

describe("Header", () => {
  it("shows confirmed address and work hours from contacts", () => {
    const data = getPreviewLandingData();

    render(
      <ModalProvider metrikaId={undefined}>
        <Header
          data={data.header}
          address={data.contacts.address}
          workHours={data.contacts.workHours}
        />
      </ModalProvider>,
    );

    expect(
      screen.getByText("г. Хабаровск, ул. Ленина, 22, офис 12"),
    ).toBeVisible();
    expect(screen.getByText("Пн–Пт, 09:00–18:00")).toBeVisible();
  });
});
