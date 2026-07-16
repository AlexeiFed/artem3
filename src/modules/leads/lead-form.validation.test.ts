import { describe, expect, it } from "vitest";

import {
  formatRussianPhoneMask,
  isCompleteRussianPhoneMask,
  validatePersonName,
} from "./lead-form.validation";

describe("formatRussianPhoneMask", () => {
  it("formats national digits into +7 mask", () => {
    expect(formatRussianPhoneMask("9244031547")).toBe("+7 (924) 403-15-47");
    expect(formatRussianPhoneMask("89244031547")).toBe("+7 (924) 403-15-47");
    expect(formatRussianPhoneMask("+79244031547")).toBe("+7 (924) 403-15-47");
  });

  it("builds the mask progressively", () => {
    expect(formatRussianPhoneMask("9")).toBe("+7 (9");
    expect(formatRussianPhoneMask("924")).toBe("+7 (924)");
    expect(formatRussianPhoneMask("924403")).toBe("+7 (924) 403");
  });
});

describe("isCompleteRussianPhoneMask", () => {
  it("accepts only complete mask", () => {
    expect(isCompleteRussianPhoneMask("+7 (924) 403-15-47")).toBe(true);
    expect(isCompleteRussianPhoneMask("+7 (924) 403-15")).toBe(false);
  });
});

describe("validatePersonName", () => {
  it("accepts normal russian and latin names", () => {
    expect(validatePersonName("Алексей")).toBeNull();
    expect(validatePersonName("Анна-Мария")).toBeNull();
    expect(validatePersonName("Mary")).toBeNull();
  });

  it("rejects digits and symbols", () => {
    expect(validatePersonName("Alex123")).toMatch(/цифры/i);
    expect(validatePersonName("A")).toMatch(/минимум/i);
    expect(validatePersonName("@@@")).toMatch(/корректное/i);
  });
});
