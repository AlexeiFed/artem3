"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";
import type { TrustBannerSettings } from "@/modules/content/content.types";

interface HonestyEditorProps {
  initialTrustBanner: TrustBannerSettings;
  loadError: string | null;
}

export function HonestyEditor({
  initialTrustBanner,
  loadError,
}: HonestyEditorProps) {
  const [trustBanner, setTrustBanner] = useState(initialTrustBanner);
  const [error, setError] = useState(loadError);
  const items = trustBanner.honesty.items;
  const item1 = items[0];
  const item2 = items[1];
  const item3 = items[2];

  return (
    <>
      <EntityEditor
        title="Почему мне доверяют"
        initialValue={{
          theme: trustBanner.honesty.theme,
          title: trustBanner.honesty.title,
          item1Title: item1?.title ?? "",
          item1Copy: item1?.copy ?? "",
          item2Title: item2?.title ?? "",
          item2Copy: item2?.copy ?? "",
          item3Title: item3?.title ?? "",
          item3Copy: item3?.copy ?? "",
        }}
        fields={[
          { name: "theme", label: "Надзаголовок", type: "text" },
          { name: "title", label: "Заголовок", type: "text" },
          { name: "item1Title", label: "Пункт 1 — заголовок", type: "text" },
          { name: "item1Copy", label: "Пункт 1 — текст", type: "textarea" },
          { name: "item2Title", label: "Пункт 2 — заголовок", type: "text" },
          { name: "item2Copy", label: "Пункт 2 — текст", type: "textarea" },
          { name: "item3Title", label: "Пункт 3 — заголовок", type: "text" },
          { name: "item3Copy", label: "Пункт 3 — текст", type: "textarea" },
        ]}
        onSave={async (value) => {
          const nextTrustBanner: TrustBannerSettings = {
            ...trustBanner,
            honesty: {
              theme: String(value.theme ?? ""),
              title: String(value.title ?? ""),
              items: [
                {
                  title: String(value.item1Title ?? ""),
                  copy: String(value.item1Copy ?? ""),
                },
                {
                  title: String(value.item2Title ?? ""),
                  copy: String(value.item2Copy ?? ""),
                },
                {
                  title: String(value.item3Title ?? ""),
                  copy: String(value.item3Copy ?? ""),
                },
              ],
            },
          };
          const response = await fetch("/api/admin/content/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trustBanner: nextTrustBanner }),
          });
          if (!response.ok) {
            const parsed = AdminApiErrorSchema.safeParse(await response.json());
            throw new Error(
              parsed.success
                ? parsed.data.error.message
                : "Ошибка сохранения",
            );
          }
          setTrustBanner(nextTrustBanner);
          setError(null);
        }}
      />
      {error ? (
        <p className="mt-4 text-sm text-secondary" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
