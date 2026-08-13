"use client";

import { useState } from "react";

import {
  MediaUploader,
  type UploadedMediaAsset,
} from "@/components/admin/MediaUploader";

export type MediaLibraryItem = {
  id: string;
  url: string;
  altText: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

interface MediaLibraryProps {
  initialItems: MediaLibraryItem[];
  loadError: string | null;
}

function toSitePath(url: string): string {
  try {
    const parsed = new URL(url, "https://placeholder.local");
    if (parsed.pathname.startsWith("/media/")) {
      return parsed.pathname;
    }
  } catch {
    // keep original
  }
  return url;
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ initialItems, loadError }: MediaLibraryProps) {
  const [items, setItems] = useState(initialItems);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState(loadError);

  async function copyPath(item: MediaLibraryItem): Promise<void> {
    const path = toSitePath(item.url);
    try {
      await navigator.clipboard.writeText(path);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Не удалось скопировать путь.");
    }
  }

  function onUploaded(asset: UploadedMediaAsset): void {
    setItems((current) => [
      {
        id: asset.id,
        url: asset.url,
        altText: asset.altText,
        mimeType: asset.url.endsWith(".mp4") ? "video/mp4" : "image/png",
        size: 0,
        createdAt: new Date().toISOString(),
      },
      ...current.filter((item) => item.id !== asset.id),
    ]);
    setError(null);
  }

  return (
    <div className="grid max-w-4xl gap-8">
      <p className="font-sans text-secondary">
        JPEG/PNG/WebP до 12 МБ, MP4 до 100 МБ. Ниже — все загруженные файлы с
        путём <code className="text-sm">/media/uploads/…</code> для вставки в
        «Документы» и другие поля.
      </p>

      <MediaUploader onCompleted={onUploaded} />

      {error ? (
        <p className="font-sans text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Загруженные файлы ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="font-sans text-sm text-secondary">
            Пока ничего нет — загрузите файл выше.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const path = toSitePath(item.url);
              const isImage = item.mimeType.startsWith("image/");
              return (
                <li
                  key={item.id}
                  className="grid gap-3 rounded-panel border border-sage/30 p-4"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview
                    <img
                      src={path}
                      alt={item.altText}
                      className="h-40 w-full rounded-card border border-sage/20 object-contain bg-background"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-card border border-sage/20 bg-background font-sans text-sm text-secondary">
                      {item.mimeType || "файл"}
                    </div>
                  )}
                  <code className="break-all font-sans text-xs text-primary">
                    {path}
                  </code>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-sans text-xs text-secondary">
                      {item.size > 0 ? formatBytes(item.size) : null}
                    </span>
                    <button
                      type="button"
                      className="rounded-control border border-sage px-3 py-1.5 font-sans text-sm text-secondary"
                      onClick={() => {
                        void copyPath(item);
                      }}
                    >
                      {copiedId === item.id ? "Скопировано" : "Копировать путь"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
