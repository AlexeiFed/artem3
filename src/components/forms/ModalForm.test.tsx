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

function openAndFill() {
  fireEvent.click(screen.getByRole("button", { name: "Открыть форму" }));
  fireEvent.change(screen.getByLabelText("Ваше имя"), {
    target: { value: "Алексей" },
  });
  fireEvent.change(screen.getByLabelText("Телефон"), {
    target: { value: "9991234567" },
  });
}

function checkConsent() {
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: /соглашаетесь на обработку персональных данных/i,
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.ym;
});

describe("global lead modal", () => {
  it("keeps submit disabled until personal-data consent is checked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );

    render(
      <ModalProvider metrikaId={123}>
        <Trigger />
      </ModalProvider>,
    );

    openAndFill();

    const submit = screen.getByRole("button", { name: "Получить план действий" });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByRole("checkbox", { name: /получение рассылки/i }),
    ).toBeNull();

    checkConsent();
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    expect(await screen.findByText("Спасибо за обращение! Заявка принята.")).toBeVisible();
    expect(
      screen.getByText(/Свяжусь с вами в течение 1 часа в рабочее время/),
    ).toBeVisible();
  });

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

    const submit = screen.getByRole("button", { name: "Получить план действий" });
    expect(submit).toBeDisabled();

    checkConsent();

    fireEvent.click(submit);
    expect(screen.getByText("Введите имя (минимум 2 символа)")).toBeVisible();
    expect(
      screen.getByText("Введите телефон в формате +7 (___) ___-__-__"),
    ).toBeVisible();
    expect(window.ym).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Ваше имя"), {
      target: { value: "Алексей" },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "9991234567" },
    });
    expect(screen.getByLabelText("Телефон")).toHaveValue("+7 (999) 123-45-67");
    fireEvent.click(screen.getByRole("button", { name: "Получить план действий" }));

    expect(await screen.findByText("Спасибо за обращение! Заявка принята.")).toBeVisible();
    const body = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit).body),
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      name: "Алексей",
      phone: "+7 (999) 123-45-67",
      service: "Раздел имущества",
      isDataAgreed: true,
      isMarketingAgreed: false,
    });
    await waitFor(() => {
      expect(window.ym).toHaveBeenCalledWith(123, "reachGoal", "lead_success");
    });
  });

  it("rejects all-identical phone digits before submit", async () => {
    render(
      <ModalProvider metrikaId={undefined}>
        <Trigger />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть форму" }));
    checkConsent();
    fireEvent.change(screen.getByLabelText("Ваше имя"), {
      target: { value: "Тест" },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "9999999999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Получить план действий" }));

    expect(screen.getByText("Введите корректный российский номер")).toBeVisible();
  });
});
