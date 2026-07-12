// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm, safeAdminNextPath } from "./LoginForm";

afterEach(() => {
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
    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest(
      "form",
    )!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Неверная почта или пароль.",
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
