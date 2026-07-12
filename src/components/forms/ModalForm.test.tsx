// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModalProvider, useModal } from "./ModalProvider";

function Trigger() {
  const { openModal } = useModal();
  return (
    <button type="button" onClick={() => openModal("Раздел имущества")}>
      Открыть форму
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.ym;
});

describe("global lead modal", () => {
  it("opens for a service, validates, succeeds and fires Metrika only after 201", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }));
    window.ym = vi.fn();

    render(
      <ModalProvider metrikaId={123}>
        <Trigger />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть форму" }));
    expect(screen.getByText("Раздел имущества")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));
    expect(screen.getByText("Введите имя")).toBeVisible();
    expect(screen.getByText("Введите телефон")).toBeVisible();
    expect(window.ym).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Имя"), {
      target: { value: "Алексей" },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "+7 999 123-45-67" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));

    expect(await screen.findByText("Спасибо, заявка получена.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leads",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => {
      expect(window.ym).toHaveBeenCalledWith(123, "reachGoal", "lead_success");
    });
  });
});
