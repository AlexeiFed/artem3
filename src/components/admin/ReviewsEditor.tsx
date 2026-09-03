"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { readAdminErrorMessage } from "@/components/admin/format-admin-error";
import { SortableEntityList } from "@/components/admin/SortableEntityList";

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

const NEW_REVIEW = {
  author: "Новый отзыв",
  quote: "Текст отзыва с публичной площадки",
  imageUrl: null,
  source: "Яндекс",
  sourceUrl:
    "https://yandex.ru/maps/org/yuridicheskaya_kompaniya_artema_sysuyeva/86909776127/reviews/",
} as const;

export function ReviewsEditor({
  initialItems,
  loadError,
}: ReviewsEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [error, setError] = useState(loadError);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="flex flex-col gap-3 self-start">
        <button
          type="button"
          className="shrink-0 rounded-card bg-forest px-4 py-2.5 font-sans text-sm text-background"
          onClick={async () => {
            const response = await fetch("/api/admin/content/reviews", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(NEW_REVIEW),
            });
            if (!response.ok) {
              setError(
                readAdminErrorMessage(
                  await response.json(),
                  "Не удалось создать отзыв",
                ),
              );
              return;
            }
            const body = (await response.json()) as {
              ok: true;
              data: ReviewEditorItem;
            };
            setItems((current) => [...current, body.data]);
            setSelectedId(body.data.id);
            setError(null);
          }}
        >
          Добавить отзыв
        </button>
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
              setError(
                readAdminErrorMessage(
                  await response.json(),
                  "Ошибка reorder",
                ),
              );
              return;
            }
            setItems(
              orderedIds
                .map((id) => items.find((item) => item.id === id))
                .filter((item): item is ReviewEditorItem => item !== undefined),
            );
            setError(null);
          }}
        />
      </div>
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
              throw new Error(
                readAdminErrorMessage(
                  await response.json(),
                  "Ошибка сохранения",
                ),
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
          onDelete={async () => {
            const response = await fetch(
              `/api/admin/content/reviews/${selected.id}`,
              { method: "DELETE" },
            );
            if (!response.ok) {
              setError(
                readAdminErrorMessage(
                  await response.json(),
                  "Не удалось удалить",
                ),
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
        <p className="text-sm text-error lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
