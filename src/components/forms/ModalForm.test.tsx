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
      name: /согласие на обработку персональных данных/i,
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

    expect(
      screen.getByRole("link", { name: /согласию на обработку персональных данных/i }),
    ).toHaveAttribute("href", "/personal-data");
    expect(
      screen.getByRole("link", {
        name: /политике в отношении обработки персональных данных/i,
      }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByText(/Не указывайте ФИО детей, паспортные данные/i),
    ).toBeVisible();
    expect(screen.getByText(/ред\. от 22\.08\.2026/i)).toBeVisible();

    checkConsent();
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    expect(
      await screen.findByRole("heading", {
        name: /Спасибо за обращение!\s*Заявка принята\./,
      }),
    ).toBeVisible();
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

    expect(
      await screen.findByRole("heading", {
        name: /Спасибо за обращение!\s*Заявка принята\./,
      }),
    ).toBeVisible();
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

  it("labels the situation field without the redundant optional hint", () => {
    render(
      <ModalProvider metrikaId={undefined}>
        <Trigger />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть форму" }));

    expect(screen.getByLabelText("Суть вопроса")).toBeVisible();
    expect(screen.queryByText("(необязательно)")).not.toBeInTheDocument();
  });

  it("opens the dialog without scrolling inner form content", () => {
    const focus = vi.spyOn(HTMLInputElement.prototype, "focus");

    render(
      <ModalProvider metrikaId={undefined}>
        <Trigger />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть форму" }));

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("moves the overlay when a field would sit under the keyboard", () => {
    vi.stubGlobal("visualViewport", {
      height: 400,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <ModalProvider metrikaId={undefined}>
        <Trigger />
      </ModalProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть форму" }));

    const phone = screen.getByLabelText("Телефон");
    const fieldScrollIntoView = vi.fn();
    phone.scrollIntoView = fieldScrollIntoView;
    vi.spyOn(phone, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 450,
      top: 450,
      right: 320,
      bottom: 500,
      left: 0,
      width: 320,
      height: 50,
      toJSON() {
        return {};
      },
    });

    const backdrop = document.querySelector(".modal-backdrop");
    if (!(backdrop instanceof HTMLElement)) {
      throw new Error("Missing modal backdrop");
    }
    const scrollBy = vi.fn();
    backdrop.scrollBy = scrollBy;

    fireEvent.focus(phone);

    expect(fieldScrollIntoView).not.toHaveBeenCalled();
    expect(scrollBy).toHaveBeenCalledWith({
      top: 124,
      behavior: "smooth",
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

  it("shows a rate-limit message instead of a generic network error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Слишком много заявок. Попробуйте позже.",
            retryAfterSeconds: 60,
          },
        },
        { status: 429 },
      ),
    );

    render(
      <ModalProvider metrikaId={undefined}>
        <Trigger />
      </ModalProvider>,
    );

    openAndFill();
    checkConsent();
    fireEvent.click(screen.getByRole("button", { name: "Получить план действий" }));

    expect(
      await screen.findByText("Слишком много заявок. Попробуйте позже."),
    ).toBeVisible();
    expect(
      screen.queryByText(/Не удалось отправить заявку/),
    ).not.toBeInTheDocument();
  });
});
