// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LeadStatus } from "@/modules/leads/admin-leads.schemas";

import { LeadsPanel } from "./LeadsPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

interface LeadFixture {
  id: string;
  name: string;
  phone: string;
  situation: string | null;
  serviceName: string | null;
  status: LeadStatus;
  createdAt: string;
}

const item: LeadFixture = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Алексей",
  phone: "+79991234567",
  situation: null,
  serviceName: "Расторжение брака",
  status: "NEW",
  createdAt: "2026-08-31T09:52:10.000Z",
};

function jsonPage(items: LeadFixture[], nextCursor: string | null = null) {
  return Response.json({
    ok: true,
    data: { items, nextCursor },
  });
}

describe("LeadsPanel status filter", () => {
  it("loads closed leads when the closed filter is pressed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonPage([{ ...item, status: "CLOSED", name: "Ирина" }]),
      ),
    );

    render(
      <LeadsPanel
        initialItems={[item]}
        initialNextCursor={null}
        loadError={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Закрыта" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/leads?status=CLOSED",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
    expect(await screen.findByText("Ирина")).toBeInTheDocument();
    expect(screen.queryByText("Алексей")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Закрыта" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("downloads CSV for the active status filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(jsonPage([]))
        .mockResolvedValueOnce(new Response("csv", { status: 200 })),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:leads");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    render(
      <LeadsPanel
        initialItems={[item]}
        initialNextCursor={null}
        loadError={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Закрыта" }));
    await screen.findByText("Нет заявок с выбранным статусом.");

    fireEvent.click(screen.getByRole("button", { name: "Скачать CSV" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/leads/export?status=CLOSED",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
  });

  it("keeps the status filter on load more", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          jsonPage([{ ...item, status: "CLOSED" }], "c1"),
        )
        .mockResolvedValueOnce(
          jsonPage([{ ...item, id: "22222222-2222-4222-8222-222222222222", name: "Ирина", status: "CLOSED" }]),
        ),
    );

    render(
      <LeadsPanel
        initialItems={[item]}
        initialNextCursor={null}
        loadError={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Закрыта" }));
    fireEvent.click(await screen.findByRole("button", { name: "Показать ещё" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/leads?status=CLOSED&cursor=c1",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
    expect(await screen.findByText("Ирина")).toBeInTheDocument();
  });

  it("drops a row that leaves the active status filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(jsonPage([item]))
        .mockResolvedValueOnce(
          Response.json({ ok: true, data: { ...item, status: "CLOSED" } }),
        ),
    );

    render(
      <LeadsPanel
        initialItems={[item]}
        initialNextCursor={null}
        loadError={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Новая" }));
    await screen.findByText("Алексей");

    fireEvent.change(screen.getByLabelText("Статус заявки Алексей"), {
      target: { value: "CLOSED" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Алексей")).not.toBeInTheDocument();
    });
  });
});
