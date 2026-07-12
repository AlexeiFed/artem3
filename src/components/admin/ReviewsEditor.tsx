"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { SortableEntityList } from "@/components/admin/SortableEntityList";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

export interface ReviewEditorItem {
  id: string;
  author: string;
  quote: string;
  imageUrl: string | null;
  source: string;
  sourceUrl: string;
}

interface ReviewsEditorProps {
  initialItems: ReviewEditorItem[];
  loadError: string | null;
}

export function ReviewsEditor({
  initialItems,
  loadError,
}: ReviewsEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [error, setError] = useState(loadError);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <SortableEntityList
        items={items.map((item) => ({ id: item.id, label: item.author }))}
        {...(selectedId ? { selectedId } : {})}
        onSelect={setSelectedId}
        onReorder={async (orderedIds) => {
          const response = await fetch("/api/admin/content/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "reviews", orderedIds }),
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
              .filter((item): item is ReviewEditorItem => item !== undefined),
          );
        }}
      />
      {selected ? (
        <EntityEditor
          key={selected.id}
          title={selected.author}
          initialValue={{
            author: selected.author,
            quote: selected.quote,
            imageUrl: selected.imageUrl ?? "",
            source: selected.source,
            sourceUrl: selected.sourceUrl,
          }}
          fields={[
            { name: "author", label: "Автор", type: "text" },
            { name: "quote", label: "Цитата", type: "textarea" },
            { name: "imageUrl", label: "URL изображения", type: "url" },
            { name: "source", label: "Источник", type: "text" },
            { name: "sourceUrl", label: "URL источника", type: "url" },
          ]}
          onSave={async (value) => {
            const imageUrl =
              typeof value.imageUrl === "string" &&
              value.imageUrl.trim() === ""
                ? null
                : value.imageUrl;
            const response = await fetch(
              `/api/admin/content/reviews/${selected.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...value, imageUrl }),
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
                      author: String(value.author ?? item.author),
                      quote: String(value.quote ?? item.quote),
                      imageUrl:
                        typeof imageUrl === "string" || imageUrl === null
                          ? imageUrl
                          : item.imageUrl,
                      source: String(value.source ?? item.source),
                      sourceUrl: String(value.sourceUrl ?? item.sourceUrl),
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
