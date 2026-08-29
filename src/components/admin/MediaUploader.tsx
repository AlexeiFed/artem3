"use client";

import { useState, type ChangeEvent } from "react";

import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

import { copyTextToClipboard } from "./copy-text";

export type UploadedMediaAsset = {
  id: string;
  url: string;
  altText: string;
};

interface MediaUploaderProps {
  onCompleted?(asset: UploadedMediaAsset): void;
  inputId?: string;
}

function toSitePath(url: string): string {
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

export function MediaUploader({
  onCompleted,
  inputId = "media-upload",
}: MediaUploaderProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastAsset, setLastAsset] = useState<UploadedMediaAsset | null>(null);
  const [copied, setCopied] = useState<"url" | "path" | null>(null);

  async function copyText(
    value: string,
    kind: "url" | "path",
  ): Promise<void> {
    try {
      await copyTextToClipboard(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Не удалось скопировать в буфер обмена.");
    }
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    setError(null);
    setLastAsset(null);
    setCopied(null);
    setProgress(0);

    try {
      const presignResponse = await fetch("/api/admin/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          altText: file.name,
        }),
      });

      if (!presignResponse.ok) {
        const parsed = AdminApiErrorSchema.safeParse(await presignResponse.json());
        throw new Error(
          parsed.success
            ? parsed.data.error.message
            : "Не удалось получить URL загрузки.",
        );
      }

      const presignBody = (await presignResponse.json()) as {
        ok: true;
        data: {
          objectKey: string;
          uploadUrl: string;
          mimeType: string;
          size: number;
          altText: string;
        };
      };

      await uploadWithProgress(
        presignBody.data.uploadUrl,
        file,
        setProgress,
      );

      const completeResponse = await fetch("/api/admin/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: presignBody.data.objectKey,
          mimeType: presignBody.data.mimeType,
          size: presignBody.data.size,
          altText: presignBody.data.altText,
        }),
      });

      if (!completeResponse.ok) {
        const parsed = AdminApiErrorSchema.safeParse(await completeResponse.json());
        throw new Error(
          parsed.success
            ? parsed.data.error.message
            : "Не удалось подтвердить загрузку.",
        );
      }

      const completeBody = (await completeResponse.json()) as {
        ok: true;
        data: UploadedMediaAsset;
      };
      setLastAsset(completeBody.data);
      onCompleted?.(completeBody.data);
      setProgress(100);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Ошибка загрузки файла.",
      );
      setProgress(null);
      setLastAsset(null);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  const sitePath = lastAsset ? toSitePath(lastAsset.url) : null;

  return (
    <div className="grid gap-3 rounded-panel border border-sage/40 p-5">
      <label className="font-sans text-sm text-secondary" htmlFor={inputId}>
        Загрузка файла (локально или S3)
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        disabled={busy}
        onChange={(event) => {
          void onFileChange(event);
        }}
      />
      {progress !== null && !lastAsset ? (
        <div
          className="h-2 overflow-hidden rounded-control bg-sage/20"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-forest transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {busy ? (
        <p className="font-sans text-sm text-secondary">Загрузка… {progress ?? 0}%</p>
      ) : null}
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {lastAsset && sitePath ? (
        <div
          className="grid gap-3 rounded-card border border-sage/30 bg-background p-4"
          role="status"
        >
          <p className="font-sans text-sm font-semibold text-forest">
            Файл загружен
          </p>
          <label className="grid gap-1 font-sans text-sm text-secondary">
            Путь для документов / полей сайта
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-control border border-sage/30 px-3 py-2 text-primary">
                {sitePath}
              </code>
              <button
                type="button"
                className="shrink-0 rounded-control border border-sage px-3 py-2 text-sm text-secondary"
                onClick={() => {
                  void copyText(sitePath, "path");
                }}
              >
                {copied === "path" ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </label>
          <label className="grid gap-1 font-sans text-sm text-secondary">
            Полный URL
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-control border border-sage/30 px-3 py-2 text-primary">
                {lastAsset.url}
              </code>
              <button
                type="button"
                className="shrink-0 rounded-control border border-sage px-3 py-2 text-sm text-secondary"
                onClick={() => {
                  void copyText(lastAsset.url, "url");
                }}
              >
                {copied === "url" ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </label>
          {/\.(jpe?g|png|webp)$/i.test(sitePath) ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img
              src={sitePath}
              alt={lastAsset.altText}
              className="max-h-64 w-full rounded-card border border-sage/30 object-contain"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (value: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      if (xhr.status === 413) {
        reject(
          new Error(
            "Файл слишком большой для прокси (HTTP 413). Нужен client_max_body_size ≥ 105m в nginx.",
          ),
        );
        return;
      }
      reject(
        new Error(`Хранилище отклонило загрузку файла (HTTP ${xhr.status}).`),
      );
    };
    xhr.onerror = () => reject(new Error("Сетевая ошибка при загрузке."));
    xhr.send(file);
  });
}
