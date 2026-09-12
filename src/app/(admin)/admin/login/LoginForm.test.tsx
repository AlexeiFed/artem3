// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm, safeAdminNextPath } from "./LoginForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LoginForm", () => {
  it("has accessible email/password fields and reports a generic login error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Неверная почта или пароль.",
            },
          },
          { status: 401 },
        ),
      ),
    );
    render(<LoginForm nextPath="/admin" />);

    fireEvent.change(screen.getByLabelText("Электронная почта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "wrong-password-value" },
    });
    fireEvent.submit(screen.getByLabelText("Пароль").closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Неверная почта или пароль.",
      );
    });
  });

  it("toggles password visibility without submitting the form", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginForm nextPath="/admin" />);

    const password = screen.getByLabelText("Пароль");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("spellcheck", "false");
    expect(password).toHaveAttribute("autocapitalize", "none");
    expect(password).toHaveAttribute("autocorrect", "off");

    fireEvent.click(screen.getByRole("button", { name: "Показать пароль" }));
    expect(password).toHaveAttribute("type", "text");
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Скрыть пароль" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("submits the typed password from the input value", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ ok: false }, { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginForm nextPath="/admin" />);

    fireEvent.change(screen.getByLabelText("Электронная почта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "typed-password-xx" },
    });
    fireEvent.submit(screen.getByLabelText("Пароль").closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "admin@example.com",
            password: "typed-password-xx",
          }),
        }),
      );
    });
  });

  it.each([
    ["/admin/cases?status=open", "/admin/cases?status=open"],
    ["https://evil.test/admin", "/admin"],
    ["//evil.test/admin", "/admin"],
    ["/not-admin", "/admin"],
    [undefined, "/admin"],
  ])("sanitizes next=%s to %s", (input, expected) => {
    expect(safeAdminNextPath(input)).toBe(expected);
  });
});
