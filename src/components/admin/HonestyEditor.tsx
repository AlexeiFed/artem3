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

  return (
    <>
      <EntityEditor
        title="Честно о результате"
        initialValue={{
          theme: trustBanner.honesty.theme,
          title: trustBanner.honesty.title,
          copy: trustBanner.honesty.copy,
        }}
        fields={[
          { name: "theme", label: "Надзаголовок", type: "text" },
          { name: "title", label: "Заголовок", type: "text" },
          { name: "copy", label: "Текст", type: "textarea" },
        ]}
        onSave={async (value) => {
          const nextTrustBanner: TrustBannerSettings = {
            ...trustBanner,
            honesty: {
              theme: String(value.theme ?? ""),
              title: String(value.title ?? ""),
              copy: String(value.copy ?? ""),
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
