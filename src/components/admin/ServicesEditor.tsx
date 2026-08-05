"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { SortableEntityList } from "@/components/admin/SortableEntityList";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

export interface ServiceEditorItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  situations: string[];
  trustNote: string;
  priceFromKopecks: number;
  isHighValue: boolean;
  isHidden: boolean;
  ctaLabel: string;
}

interface ServicesEditorProps {
  initialItems: ServiceEditorItem[];
  loadError: string | null;
}

function rublesFromKopecks(kopecks: number): number {
  return Math.round(kopecks / 100);
}

function kopecksFromRubles(rubles: number): number {
  return Math.round(rubles * 100);
}

function situationsToText(situations: string[]): string {
  return situations.join("\n");
}

function textToSituations(value: unknown): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function ServicesEditor({
  initialItems,
  loadError,
}: ServicesEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [error, setError] = useState(loadError);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="flex flex-col gap-3 self-start">
        <p className="font-sans text-xs text-secondary">
          Блок «С чем помочь» на лендинге строится из этого списка услуг.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-card bg-forest px-4 py-2.5 font-sans text-sm text-background"
          onClick={async () => {
            const slug = `usluga-${Date.now().toString(36)}`;
            const response = await fetch("/api/admin/content/services", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug,
                title: "Новая услуга",
                description:
                  "Кратко опишите, чем помогаете клиенту в этой услуге.",
                situations: [
                  "Типовая ситуация 1",
                  "Типовая ситуация 2",
                  "Типовая ситуация 3",
                ],
                trustNote: "Короткое пояснение для клиента.",
                priceFromKopecks: 0,
                isHighValue: false,
                isHidden: false,
                ctaLabel: "Получить оценку ситуации",
              }),
            });
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(
                await response.json(),
              );
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Не удалось создать услугу",
              );
              return;
            }
            const body = (await response.json()) as {
              ok: true;
              data: ServiceEditorItem;
            };
            setItems((current) => [...current, body.data]);
            setSelectedId(body.data.id);
            setError(null);
          }}
        >
          Добавить услугу
        </button>
        <SortableEntityList
          items={items.map((item) => ({
            id: item.id,
            label: item.isHidden ? `${item.title} (скрыта)` : item.title,
          }))}
          {...(selectedId ? { selectedId } : {})}
          onSelect={setSelectedId}
          onReorder={async (orderedIds) => {
            const response = await fetch("/api/admin/content/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entity: "services", orderedIds }),
            });
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(
                await response.json(),
              );
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Ошибка reorder",
              );
              return;
            }
            setItems(
              orderedIds
                .map((id) => items.find((item) => item.id === id))
                .filter(
                  (item): item is ServiceEditorItem => item !== undefined,
                ),
            );
            setError(null);
          }}
        />
      </div>
      {selected ? (
        <EntityEditor
          key={selected.id}
          title={selected.title}
          initialValue={{
            title: selected.title,
            description: selected.description,
            situationsText: situationsToText(selected.situations),
            trustNote: selected.trustNote,
            priceFromRubles: rublesFromKopecks(selected.priceFromKopecks),
            isHighValue: selected.isHighValue,
            ctaLabel: selected.ctaLabel,
          }}
          fields={[
            { name: "title", label: "Название", type: "text" },
            {
              name: "description",
              label: "Короткое описание (2–3 строки над списком)",
              type: "textarea",
            },
            {
              name: "situationsText",
              label:
                "Пункты списка на карточке — каждый с новой строки (3–6 пунктов)",
              type: "textarea",
            },
            { name: "trustNote", label: "Заметка «Важно»", type: "text" },
            {
              name: "priceFromRubles",
              label: "Цена от (₽)",
              type: "number",
            },
            {
              name: "ctaLabel",
              label: "Текст кнопки на карточке",
              type: "text",
            },
            {
              name: "isHighValue",
              label:
                "Высокий чек — флаг для сложных/дорогих дел (используется в админке и аналитике)",
              type: "checkbox",
            },
          ]}
          visibilityLabel={selected.isHidden ? "Показать на сайте" : "Скрыть с сайта"}
          onToggleVisibility={async () => {
            const nextHidden = !selected.isHidden;
            const response = await fetch(
              `/api/admin/content/services/${selected.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  slug: selected.slug,
                  situations: selected.situations,
                  title: selected.title,
                  description: selected.description,
                  trustNote: selected.trustNote,
                  priceFromKopecks: selected.priceFromKopecks,
                  isHighValue: selected.isHighValue,
                  isHidden: nextHidden,
                  ctaLabel: selected.ctaLabel,
                }),
              },
            );
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(
                await response.json(),
              );
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Не удалось изменить видимость",
              );
              return;
            }
            setItems((current) =>
              current.map((item) =>
                item.id === selected.id
                  ? { ...item, isHidden: nextHidden }
                  : item,
              ),
            );
            setError(null);
          }}
          onSave={async (value) => {
            const priceFromKopecks = kopecksFromRubles(
              Number(value.priceFromRubles ?? 0),
            );
            const ctaLabel = String(
              value.ctaLabel ?? selected.ctaLabel ?? "Получить оценку ситуации",
            );
            const situations = textToSituations(value.situationsText);
            if (situations.length < 3 || situations.length > 6) {
              throw new Error("Нужно от 3 до 6 пунктов списка (по одному в строке)");
            }
            const response = await fetch(
              `/api/admin/content/services/${selected.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  slug: selected.slug,
                  situations,
                  title: value.title,
                  description: value.description,
                  trustNote: value.trustNote,
                  priceFromKopecks,
                  isHighValue: value.isHighValue,
                  isHidden: selected.isHidden,
                  ctaLabel,
                }),
              },
            );
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(
                await response.json(),
              );
              throw new Error(
                parsed.success
                  ? parsed.data.error.message
                  : "Ошибка сохранения",
              );
            }
            setItems((current) =>
              current.map((item) =>
                item.id === selected.id
                  ? {
                      ...item,
                      title: String(value.title ?? item.title),
                      description: String(
                        value.description ?? item.description,
                      ),
                      situations,
                      trustNote: String(value.trustNote ?? item.trustNote),
                      priceFromKopecks,
                      isHighValue: Boolean(
                        value.isHighValue ?? item.isHighValue,
                      ),
                      ctaLabel,
                    }
                  : item,
              ),
            );
          }}
          onDelete={async () => {
            const response = await fetch(
              `/api/admin/content/services/${selected.id}`,
              { method: "DELETE" },
            );
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(
                await response.json(),
              );
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Не удалось удалить",
              );
              return;
            }
            setItems((current) => {
              const next = current.filter((item) => item.id !== selected.id);
              setSelectedId(next[0]?.id ?? null);
              return next;
            });
            setError(null);
          }}
        />
      ) : null}
      {error ? (
        <p className="text-sm text-secondary lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
