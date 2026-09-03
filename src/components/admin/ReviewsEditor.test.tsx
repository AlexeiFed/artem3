// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewsEditor, type ReviewEditorItem } from "./ReviewsEditor";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const item: ReviewEditorItem = {
  id: "40000000-0000-4000-8000-000000000001",
  author: "Ульяна Жигулёва",
  quote: "На развод долго не решалась",
  imageUrl: null,
  source: "2ГИС",
  sourceUrl: "https://2gis.ru/khabarovsk/firm/70000001034709262/tab/reviews",
};

describe("ReviewsEditor", () => {
  it("creates a review through the admin API", async () => {
    const created: ReviewEditorItem = {
      ...item,
      id: "40000000-0000-4000-8000-000000000099",
      author: "Новый отзыв",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ ok: true, data: created }, { status: 201 }),
      ),
    );

    render(<ReviewsEditor initialItems={[item]} loadError={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить отзыв" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Автор")).toHaveValue("Новый отзыв");
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/content/reviews",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the review limit from a 409 conflict instead of the generic title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            ok: false,
            error: {
              code: "CONFLICT",
              message: "Конфликт данных.",
              fields: { _form: ["Достигнут лимит записей (6)"] },
            },
          },
          { status: 409 },
        ),
      ),
    );

    render(<ReviewsEditor initialItems={[item]} loadError={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить отзыв" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Достигнут лимит записей (6)");
  });

  it("deletes the selected review through the admin API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ ok: true, data: { id: item.id } })),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ReviewsEditor initialItems={[item]} loadError={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Автор")).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/content/reviews/${item.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
