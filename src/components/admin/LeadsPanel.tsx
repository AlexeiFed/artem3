"use client";

import { useState } from "react";

import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";
import type { LeadStatus } from "@/modules/leads/admin-leads.schemas";

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  situation: string | null;
  serviceName: string | null;
  status: LeadStatus;
  createdAt: string;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
};

interface LeadsPanelProps {
  initialItems: LeadRow[];
  loadError: string | null;
}

export function LeadsPanel({ initialItems, loadError }: LeadsPanelProps) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState(loadError);

  async function downloadCsv(): Promise<void> {
    const response = await fetch("/api/admin/leads/export", {
      cache: "no-store",
    });
    if (!response.ok) {
      const parsed = AdminApiErrorSchema.safeParse(await response.json());
      setError(
        parsed.success ? parsed.data.error.message : "Не удалось скачать CSV",
      );
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "leads.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-control bg-forest px-4 py-2 font-sans text-sm text-background"
          onClick={() => {
            void downloadCsv();
          }}
        >
          Скачать CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-sage/40 text-secondary">
              <th className="px-3 py-3 font-medium">Дата</th>
              <th className="px-3 py-3 font-medium">Имя</th>
              <th className="px-3 py-3 font-medium">Телефон</th>
              <th className="px-3 py-3 font-medium">Услуга</th>
              <th className="px-3 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-sage/20 align-top">
                <td className="px-3 py-3 text-secondary">
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-3 py-3 text-primary">{item.name}</td>
                <td className="px-3 py-3 text-primary">{item.phone}</td>
                <td className="px-3 py-3 text-secondary">
                  {item.serviceName ?? "—"}
                </td>
                <td className="px-3 py-3">
                  <label className="sr-only" htmlFor={`status-${item.id}`}>
                    Статус заявки {item.name}
                  </label>
                  <select
                    id={`status-${item.id}`}
                    className="rounded-control border border-sage bg-background px-3 py-2"
                    value={item.status}
                    onChange={(event) => {
                      void (async () => {
                        const status = event.target.value as LeadStatus;
                        const response = await fetch(
                          `/api/admin/leads/${item.id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status }),
                          },
                        );
                        if (!response.ok) {
                          const parsed = AdminApiErrorSchema.safeParse(
                            await response.json(),
                          );
                          setError(
                            parsed.success
                              ? parsed.data.error.message
                              : "Не удалось обновить статус",
                          );
                          return;
                        }
                        setItems((current) =>
                          current.map((row) =>
                            row.id === item.id ? { ...row, status } : row,
                          ),
                        );
                      })();
                    }}
                  >
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(
                      (status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ),
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-secondary" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
