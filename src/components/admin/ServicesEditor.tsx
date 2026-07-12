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
}

interface ServicesEditorProps {
  initialItems: ServiceEditorItem[];
  loadError: string | null;
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
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <SortableEntityList
        items={items.map((item) => ({ id: item.id, label: item.title }))}
        {...(selectedId ? { selectedId } : {})}
        onSelect={setSelectedId}
        onReorder={async (orderedIds) => {
          const response = await fetch("/api/admin/content/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "services", orderedIds }),
          });
          if (!response.ok) {
            const parsed = AdminApiErrorSchema.safeParse(await response.json());
            setError(
              parsed.success ? parsed.data.error.message : "Ошибка reorder",
            );
            return;
          }
          setItems(
            orderedIds
              .map((id) => items.find((item) => item.id === id))
              .filter((item): item is ServiceEditorItem => item !== undefined),
          );
        }}
      />
      {selected ? (
        <EntityEditor
          key={selected.id}
          title={selected.title}
          initialValue={{
            title: selected.title,
            description: selected.description,
            trustNote: selected.trustNote,
            priceFromKopecks: selected.priceFromKopecks,
            isHighValue: selected.isHighValue,
          }}
          fields={[
            { name: "title", label: "Название", type: "text" },
            { name: "description", label: "Описание", type: "textarea" },
            { name: "trustNote", label: "Заметка доверия", type: "text" },
            {
              name: "priceFromKopecks",
              label: "Цена от (копейки)",
              type: "number",
            },
            { name: "isHighValue", label: "Высокий чек", type: "checkbox" },
          ]}
          onSave={async (value) => {
            const response = await fetch(
              `/api/admin/content/services/${selected.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  slug: selected.slug,
                  situations: selected.situations,
                  ...value,
                }),
              },
            );
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(await response.json());
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
                      trustNote: String(value.trustNote ?? item.trustNote),
                      priceFromKopecks: Number(
                        value.priceFromKopecks ?? item.priceFromKopecks,
                      ),
                      isHighValue: Boolean(
                        value.isHighValue ?? item.isHighValue,
                      ),
                    }
                  : item,
              ),
            );
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
