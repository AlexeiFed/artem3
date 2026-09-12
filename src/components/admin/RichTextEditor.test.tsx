// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "./RichTextEditor";

afterEach(cleanup);

describe("RichTextEditor", () => {
  it("shows formatted text instead of raw HTML tags", () => {
    render(
      <RichTextEditor
        label="Подзаголовок"
        value={'Развод <span class="text-brass">•</span> Алименты'}
        onChange={vi.fn()}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "Подзаголовок" });
    expect(editor).toHaveTextContent("Развод • Алименты");
    expect(editor.textContent).not.toContain("span");
    expect(editor.textContent).not.toContain("class=");
    expect(editor.innerHTML).toContain("text-brass");
  });
});
