"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { SortableEntityList } from "@/components/admin/SortableEntityList";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

export interface CertificateEditorItem {
  id: string;
  title: string;
  imageUrl: string;
  altText: string;
}

interface CertificatesEditorProps {
  initialItems: CertificateEditorItem[];
  loadError: string | null;
}

const MAX_CERTIFICATES = 4;

/** Prefer site-relative /media/... paths for CertificateSchema.localAssetUrl. */
function toCertificateImageUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith("/media/")) {
      return parsed.pathname;
    }
  } catch {
    // keep original
  }
  return url;
}

export function CertificatesEditor({
  initialItems,
  loadError,
}: CertificatesEditorProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [error, setError] = useState(loadError);
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const previewUrl = draftImageUrl ?? selected?.imageUrl ?? null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="flex flex-col gap-3 self-start">
        <button
          type="button"
          className="shrink-0 rounded-card bg-forest px-4 py-2.5 font-sans text-sm text-background disabled:opacity-50"
          disabled={items.length >= MAX_CERTIFICATES}
          onClick={async () => {
            const response = await fetch("/api/admin/content/certificates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "Новый документ",
                imageUrl: "/media/artem-diploma.png",
                altText: "Скан документа об образовании",
              }),
            });
            if (!response.ok) {
              const parsed = AdminApiErrorSchema.safeParse(
                await response.json(),
              );
              setError(
                parsed.success
                  ? parsed.data.error.message
                  : "Не удалось создать документ",
              );
              return;
            }
            const body = (await response.json()) as {
              ok: true;
              data: CertificateEditorItem;
            };
            setItems((current) => [...current, body.data]);
            setSelectedId(body.data.id);
            setDraftImageUrl(null);
            setError(null);
          }}
        >
          Добавить документ
        </button>
        {items.length >= MAX_CERTIFICATES ? (
          <p className="font-sans text-xs text-secondary">
            Максимум {MAX_CERTIFICATES} документа.
          </p>
        ) : null}
        <SortableEntityList
          items={items.map((item) => ({
            id: item.id,
            label: item.title.slice(0, 72),
          }))}
          {...(selectedId ? { selectedId } : {})}
          onSelect={(id) => {
            setSelectedId(id);
            setDraftImageUrl(null);
          }}
          onReorder={async (orderedIds) => {
            const response = await fetch("/api/admin/content/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entity: "certificates", orderedIds }),
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
                  (item): item is CertificateEditorItem => item !== undefined,
                ),
            );
            setError(null);
          }}
        />
      </div>
      {selected ? (
        <div className="grid gap-6">
          <EntityEditor
            key={selected.id}
            title={selected.title}
            initialValue={{
              title: selected.title,
              imageUrl: selected.imageUrl,
              altText: selected.altText,
            }}
            fields={[
              { name: "title", label: "Название", type: "text" },
              {
                name: "imageUrl",
                label: "Путь к изображению (/media/...)",
                type: "text",
                hint: "Или загрузите скан ниже — путь подставится при сохранении.",
              },
              { name: "altText", label: "Alt-текст", type: "textarea" },
            ]}
            onSave={async (value) => {
              const imageUrl = toCertificateImageUrl(
                draftImageUrl ?? String(value.imageUrl ?? selected.imageUrl),
              );
              const response = await fetch(
                `/api/admin/content/certificates/${selected.id}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: value.title,
                    imageUrl,
                    altText: value.altText,
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
                        imageUrl,
                        altText: String(value.altText ?? item.altText),
                      }
                    : item,
                ),
              );
              setDraftImageUrl(null);
            }}
            {...(items.length > 1
              ? {
                  onDelete: async () => {
                    const response = await fetch(
                      `/api/admin/content/certificates/${selected.id}`,
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
                      const next = current.filter(
                        (item) => item.id !== selected.id,
                      );
                      setSelectedId(next[0]?.id ?? null);
                      return next;
                    });
                    setDraftImageUrl(null);
                    setError(null);
                  },
                }
              : {})}
          />
          <MediaUploader
            inputId={`certificate-upload-${selected.id}`}
            onCompleted={(asset) => {
              setDraftImageUrl(toCertificateImageUrl(asset.url));
              setError(null);
            }}
          />
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img
              src={previewUrl}
              alt={selected.altText}
              className="max-h-80 w-full rounded-card border border-sage/30 object-contain bg-background"
            />
          ) : null}
          {draftImageUrl ? (
            <p className="font-sans text-sm text-secondary">
              Новый файл: <code>{draftImageUrl}</code>. Нажмите «Сохранить».
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-secondary lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
