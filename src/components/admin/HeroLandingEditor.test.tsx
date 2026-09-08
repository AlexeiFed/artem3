// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { seedContent } from "@/db/seed-data";

import { HeroLandingEditor } from "./HeroLandingEditor";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HeroLandingEditor", () => {
  it("shows a Russian field error instead of the generic validation title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            ok: false,
            error: {
              code: "VALIDATION",
              message: "Проверьте заполненные поля.",
              fields: {
                "hero.hero.title": [
                  "Too small: expected string to have >=1 characters",
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    );

    render(
      <HeroLandingEditor
        initialHero={structuredClone(seedContent.settings.hero)}
        loadError={null}
      />,
    );

    fireEvent.change(screen.getAllByLabelText("Заголовок")[0]!, {
      target: { value: "Семейный юрист в Хабаровске" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Заголовок/u);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/заполните/iu);
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "Проверьте заполненные поля.",
    );
  });
});
