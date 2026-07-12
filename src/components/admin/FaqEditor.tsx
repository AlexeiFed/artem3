"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { SortableEntityList } from "@/components/admin/SortableEntityList";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

export interface FaqEditorItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqEditorProps {
  initialItems: FaqEditorItem[];
  loadError: string | null;
}

export function FaqEditor({ initialItems, loadError }: FaqEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [error, setError] = useState(loadError);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="grid gap-3">
        <button
          type="button"
          className="rounded-control bg-forest px-4 py-2 font-sans text-sm text-background"
          onClick={async () => {
            const response = await fetch("/api/admin/content/faqs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: "Новый вопрос",
                answer: "Новый ответ для FAQ",
              }),
            });
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(await response.json());
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Не удалось создать FAQ",
              );
              return;
            }
            const body = (await response.json()) as {
              ok: true;
              data: FaqEditorItem;
            };
            setItems((current) => [...current, body.data]);
            setSelectedId(body.data.id);
          }}
        >
          Добавить FAQ
        </button>
        <SortableEntityList
          items={items.map((item) => ({
            id: item.id,
            label: item.question,
          }))}
          {...(selectedId ? { selectedId } : {})}
          onSelect={setSelectedId}
          onReorder={async (orderedIds) => {
            const response = await fetch("/api/admin/content/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entity: "faqs", orderedIds }),
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
                .filter((item): item is FaqEditorItem => item !== undefined),
            );
          }}
        />
      </div>
      {selected ? (
        <EntityEditor
          key={selected.id}
          title="FAQ"
          initialValue={{
            question: selected.question,
            answer: selected.answer,
          }}
          fields={[
            { name: "question", label: "Вопрос", type: "text" },
            { name: "answer", label: "Ответ", type: "textarea" },
          ]}
          onSave={async (value) => {
            const response = await fetch(
              `/api/admin/content/faqs/${selected.id}`,
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
                      question: String(value.question ?? item.question),
                      answer: String(value.answer ?? item.answer),
                    }
                  : item,
              ),
            );
          }}
          onDelete={async () => {
            const response = await fetch(
              `/api/admin/content/faqs/${selected.id}`,
              { method: "DELETE" },
            );
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(await response.json());
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Не удалось удалить",
              );
              return;
            }
            setItems((current) =>
              current.filter((item) => item.id !== selected.id),
            );
            setSelectedId(null);
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
