"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { SortableEntityList } from "@/components/admin/SortableEntityList";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

export interface CaseEditorItem {
  id: string;
  situation: string;
  action: string;
  result: string;
}

interface CasesEditorProps {
  initialItems: CaseEditorItem[];
  loadError: string | null;
}

export function CasesEditor({ initialItems, loadError }: CasesEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [error, setError] = useState(loadError);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <SortableEntityList
        items={items.map((item) => ({
          id: item.id,
          label: item.situation.slice(0, 72),
        }))}
        {...(selectedId ? { selectedId } : {})}
        onSelect={setSelectedId}
        onReorder={async (orderedIds) => {
          const response = await fetch("/api/admin/content/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "cases", orderedIds }),
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
              .filter((item): item is CaseEditorItem => item !== undefined),
          );
        }}
      />
      {selected ? (
        <EntityEditor
          key={selected.id}
          title="Кейс"
          initialValue={{
            situation: selected.situation,
            action: selected.action,
            result: selected.result,
          }}
          fields={[
            { name: "situation", label: "Ситуация", type: "textarea" },
            { name: "action", label: "Действия", type: "textarea" },
            { name: "result", label: "Результат", type: "textarea" },
          ]}
          onSave={async (value) => {
            const response = await fetch(
              `/api/admin/content/cases/${selected.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
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
                      situation: String(value.situation ?? item.situation),
                      action: String(value.action ?? item.action),
                      result: String(value.result ?? item.result),
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
