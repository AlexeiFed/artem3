import { describe, expect, it } from "vitest";

import {
  AdminFormError,
  formatAdminApiError,
  humanizeValidationMessage,
  readAdminErrorMessage,
} from "./format-admin-error";

describe("formatAdminApiError", () => {
  it("maps nested contacts fields to form names with actionable Russian copy", () => {
    const error = formatAdminApiError(
      {
        ok: false,
        error: {
          code: "VALIDATION",
          message: "Проверьте заполненные поля.",
          fields: {
            "contacts.email.address": ["Invalid email address"],
            "contacts.responseSla": [
              "Too small: expected string to have >=1 characters",
            ],
          },
        },
      },
      {
        stripPrefix: "contacts.",
        fieldMap: {
          "email.address": "emailAddress",
          responseSla: "responseSla",
        },
      },
    );

    expect(error).toBeInstanceOf(AdminFormError);
    expect(error.message).toContain("Не удалось сохранить");
    expect(error.message).toContain("Email");
    expect(error.fields.emailAddress?.[0]).toMatch(/email/i);
    expect(error.fields.responseSla?.[0]).toMatch(/заполните/i);
  });
});

describe("readAdminErrorMessage", () => {
  it("prefers the domain _form message over the generic conflict title", () => {
    expect(
      readAdminErrorMessage(
        {
          ok: false,
          error: {
            code: "CONFLICT",
            message: "Конфликт данных.",
            fields: { _form: ["Достигнут лимит записей (6)"] },
          },
        },
        "Не удалось создать отзыв",
      ),
    ).toBe("Достигнут лимит записей (6)");
  });
});

describe("humanizeValidationMessage", () => {
  it("explains empty and email failures", () => {
    expect(humanizeValidationMessage("email.address", "Invalid email address")).toMatch(
      /корректный email/i,
    );
    expect(
      humanizeValidationMessage(
        "responseSla",
        "Too small: expected string to have >=1 characters",
      ),
    ).toMatch(/заполните/i);
  });
});
