// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Contacts } from "./Contacts";

afterEach(cleanup);

function renderContacts() {
  const data = getPreviewLandingData();
  const view = render(
    <ModalProvider metrikaId={undefined}>
      <Contacts
        contacts={data.contacts}
        legal={data.legal}
        yandexMapsApiKey={undefined}
      />
    </ModalProvider>,
  );
  return { data, ...view };
}

describe("Contacts panel", () => {
  it("replaces the vertical channel list with phone, messenger chips, details and CTA", () => {
    const { data, container } = renderContacts();
    const section = container.querySelector("#contacts");
    expect(section).not.toBeNull();
    expect(section?.querySelector(".contact-links")).toBeNull();

    const heading = screen.getByRole("heading", {
      level: 2,
      name: data.contacts.header,
    });
    const phone = screen.getByRole("link", { name: data.contacts.phone.display });
    expect(phone).toHaveAttribute("href", data.contacts.phone.href);
    expect(phone).toHaveClass("contacts-phone");
    expect(phone.querySelector("svg")).not.toBeNull();
    expect(
      Boolean(
        heading.compareDocumentPosition(phone) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);

    const messengers = section?.querySelector(".contacts-messengers");
    expect(messengers).not.toBeNull();
    const max = screen.getByRole("link", { name: data.contacts.max.label });
    const telegram = screen.getByRole("link", {
      name: data.contacts.telegram.label,
    });
    const whatsapp = screen.getByRole("link", {
      name: data.contacts.whatsapp.label,
    });
    expect(max).toHaveAttribute("href", data.contacts.max.url);
    expect(telegram).toHaveAttribute("href", data.contacts.telegram.url);
    expect(whatsapp).toHaveAttribute("href", data.contacts.whatsapp.url);
    for (const chip of [max, telegram, whatsapp]) {
      expect(chip).toHaveClass("contacts-chip");
      expect(chip.querySelector("svg")).not.toBeNull();
      expect(messengers?.contains(chip)).toBe(true);
    }

    expect(screen.getByText(data.contacts.responseSla)).toBeVisible();
    expect(
      screen.getByText("Переписка идёт по правилам платформ"),
    ).toBeVisible();

    const email = screen.getByRole("link", {
      name: data.contacts.email.address,
    });
    expect(email).toHaveAttribute(
      "href",
      `mailto:${data.contacts.email.address}`,
    );
    expect(email.querySelector("svg")).not.toBeNull();
    expect(
      screen.queryByRole("link", {
        name: `${data.contacts.email.label}: ${data.contacts.email.address}`,
      }),
    ).toBeNull();

    const location = section?.querySelector(".contacts-location");
    expect(location).not.toBeNull();
    expect(location).toHaveTextContent(data.contacts.address);
    expect(location).toHaveTextContent(data.contacts.workHours);
    expect(location).toHaveTextContent(data.contacts.hoursNote);
    expect(location?.contains(email)).toBe(true);

    const cta = screen.getByRole("button", { name: "Рассказать о ситуации" });
    expect(cta).toBeVisible();
    expect(cta).toHaveClass("button");
    expect(cta).not.toHaveClass("button-light");
  });
});
