"use client";

import { useLayoutEffect, useRef, useState } from "react";

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

type StatusFilter = LeadStatus | "ALL";

const STATUS_FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Все" },
  { value: "NEW", label: STATUS_LABELS.NEW },
  { value: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS },
  { value: "CLOSED", label: STATUS_LABELS.CLOSED },
];

function leadsListUrl(status: StatusFilter, cursor?: string): string {
  const params = new URLSearchParams();
  if (status !== "ALL") {
    params.set("status", status);
  }
  if (cursor !== undefined) {
    params.set("cursor", cursor);
  }
  const query = params.toString();
  return query === "" ? "/api/admin/leads" : `/api/admin/leads?${query}`;
}

function leadsExportUrl(status: StatusFilter): string {
  return status === "ALL"
    ? "/api/admin/leads/export"
    : `/api/admin/leads/export?status=${status}`;
}

interface LeadsPanelProps {
  initialItems: LeadRow[];
  initialNextCursor: string | null;
  loadError: string | null;
}

function SituationCell({ text }: { text: string | null }) {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const value = text?.trim() ?? "";

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node || !value) {
      setClamped(false);
      return;
    }
    if (expanded) return;
    setClamped(node.scrollHeight > node.clientHeight + 1);
  }, [value, expanded]);

  if (!value) {
    return <span className="text-secondary">—</span>;
  }

  return (
    <div className="max-w-sm">
      <p
        ref={contentRef}
        className={`whitespace-pre-wrap text-secondary ${expanded ? "" : "line-clamp-2"}`}
      >
        {value}
      </p>
      {clamped ? (
        <button
          type="button"
          className="mt-1 font-sans text-xs text-forest underline-offset-2 hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Свернуть" : "Показать полностью"}
        </button>
      ) : null}
    </div>
  );
}

export function LeadsPanel({
  initialItems,
  initialNextCursor,
  loadError,
}: LeadsPanelProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [error, setError] = useState(loadError);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFilter, setLoadingFilter] = useState(false);

  async function readLeadsPage(
    url: string,
  ): Promise<{ items: LeadRow[]; nextCursor: string | null } | null> {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const parsed = AdminApiErrorSchema.safeParse(await response.json());
      setError(
        parsed.success
          ? parsed.data.error.message
          : "Не удалось загрузить заявки",
      );
      return null;
    }
    const body = (await response.json()) as {
      data: {
        items: LeadRow[];
        nextCursor: string | null;
      };
    };
    return body.data;
  }

  async function applyStatusFilter(next: StatusFilter): Promise<void> {
    if (next === statusFilter) return;
    setLoadingFilter(true);
    const page = await readLeadsPage(leadsListUrl(next));
    setLoadingFilter(false);
    if (!page) return;
    setStatusFilter(next);
    setItems(page.items);
    setNextCursor(page.nextCursor);
    setError(null);
  }

  async function downloadCsv(): Promise<void> {
    const response = await fetch(leadsExportUrl(statusFilter), {
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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-control bg-forest px-4 py-2 font-sans text-sm text-background"
          onClick={() => {
            void downloadCsv();
          }}
        >
          Скачать CSV
        </button>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Фильтр по статусу"
        >
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                className={
                  active
                    ? "rounded-control bg-forest px-4 py-2 font-sans text-sm text-background"
                    : "rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary"
                }
                aria-pressed={active}
                disabled={loadingFilter}
                onClick={() => {
                  void applyStatusFilter(filter.value);
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-sage/40 text-secondary">
              <th className="px-3 py-3 font-medium">Дата</th>
              <th className="px-3 py-3 font-medium">Имя</th>
              <th className="px-3 py-3 font-medium">Телефон</th>
              <th className="px-3 py-3 font-medium">Источник</th>
              <th className="px-3 py-3 font-medium">Ситуация</th>
              <th className="px-3 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-sage/20 align-top">
                <td className="whitespace-nowrap px-3 py-3 text-secondary">
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-3 py-3 text-primary">{item.name}</td>
                <td className="whitespace-nowrap px-3 py-3 text-primary">
                  {item.phone}
                </td>
                <td className="px-3 py-3 text-secondary">
                  {item.serviceName ?? "—"}
                </td>
                <td className="px-3 py-3">
                  <SituationCell text={item.situation} />
                </td>
                <td className="px-3 py-3">
                  <label className="sr-only" htmlFor={`status-${item.id}`}>
                    Статус заявки {item.name}
                  </label>
                  <select
                    id={`status-${item.id}`}
                    className="lead-status-select rounded-control border border-sage bg-background py-2 pl-3 pr-10"
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
                        setItems((current) => {
                          const updated = current.map((row) =>
                            row.id === item.id ? { ...row, status } : row,
                          );
                          if (statusFilter !== "ALL" && status !== statusFilter) {
                            return updated.filter((row) => row.id !== item.id);
                          }
                          return updated;
                        });
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

      {items.length === 0 && !error ? (
        <p className="mt-4 font-sans text-sm text-secondary">
          {statusFilter === "ALL"
            ? "Нет заявок."
            : "Нет заявок с выбранным статусом."}
        </p>
      ) : null}

      {nextCursor ? (
        <button
          type="button"
          className="mt-4 rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary disabled:opacity-50"
          disabled={loadingMore}
          onClick={() => {
            void (async () => {
              setLoadingMore(true);
              const response = await fetch(
                leadsListUrl(
                  statusFilter,
                  nextCursor ?? undefined,
                ),
                { cache: "no-store" },
              );
              setLoadingMore(false);
              if (!response.ok) {
                const parsed = AdminApiErrorSchema.safeParse(
                  await response.json(),
                );
                setError(
                  parsed.success
                    ? parsed.data.error.message
                    : "Не удалось загрузить ещё заявки",
                );
                return;
              }
              const body = (await response.json()) as {
                data: {
                  items: LeadRow[];
                  nextCursor: string | null;
                };
              };
              setItems((current) => [...current, ...body.data.items]);
              setNextCursor(body.data.nextCursor);
            })();
          }}
        >
          {loadingMore ? "Загружаю…" : "Показать ещё"}
        </button>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
