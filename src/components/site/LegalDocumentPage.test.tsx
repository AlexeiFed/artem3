// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LegalDocumentPage } from "./LegalDocumentPage";

afterEach(() => {
  cleanup();
});

describe("LegalDocumentPage", () => {
  it("renders numbered section titles as headings", () => {
    render(
      <LegalDocumentPage
        title="Политика"
        body={`1. Общие положения\n\nТекст раздела.\n\n1.1. Подпункт остаётся абзацем.`}
        entityText="ИП"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "1. Общие положения" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /подпункт/i }),
    ).toBeNull();
    expect(screen.getByText(/Текст раздела/)).toBeInTheDocument();
  });
});
