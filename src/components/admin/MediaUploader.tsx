"use client";

import { useState, type ChangeEvent } from "react";

import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

interface MediaUploaderProps {
  onCompleted?(asset: { id: string; url: string; altText: string }): void;
}

export function MediaUploader({ onCompleted }: MediaUploaderProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    setError(null);
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
        data: { id: string; url: string; altText: string };
      };
      onCompleted?.(completeBody.data);
      setProgress(100);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Ошибка загрузки файла.",
      );
      setProgress(null);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-3 rounded-panel border border-sage/40 p-5">
      <label className="font-sans text-sm text-secondary" htmlFor="media-upload">
        Загрузка файла (локально или S3)
      </label>
      <input
        id="media-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        disabled={busy}
        onChange={(event) => {
          void onFileChange(event);
        }}
      />
      {progress !== null ? (
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
      {error ? (
        <p className="text-sm text-secondary" role="alert">
          {error}
        </p>
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
      reject(new Error("Хранилище отклонило загрузку файла."));
    };
    xhr.onerror = () => reject(new Error("Сетевая ошибка при загрузке."));
    xhr.send(file);
  });
}
