"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

interface AnalyticsEditorProps {
  initialAnalytics: {
    metrikaCounterId?: string;
    yandexVerificationContent?: string;
  };
  loadError: string | null;
}

/** Accepts raw content=… or a full `<meta name="yandex-verification" …>` paste. */
function extractVerificationContent(raw: string): string {
  const trimmed = raw.trim();
  const fromAttr = trimmed.match(/content\s*=\s*["']([^"']+)["']/iu);
  if (fromAttr?.[1]) return fromAttr[1].trim();
  return trimmed;
}

export function AnalyticsEditor({
  initialAnalytics,
  loadError,
}: AnalyticsEditorProps) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [error, setError] = useState(loadError);

  return (
    <>
      <p className="mb-6 max-w-2xl font-sans text-sm text-secondary">
        Счётчик Метрики и код проверки сайта для Яндекс Директа / Вебмастера
        (meta content). Это публичные маркетинговые коды — не пароли и не токены
        API. Цель <code className="text-primary">lead_success</code> создаётся в
        кабинете Метрики (JavaScript-событие). Для Вебмастера также доступны{" "}
        <code className="text-primary">/robots.txt</code> и{" "}
        <code className="text-primary">/sitemap.xml</code>.
      </p>
      <EntityEditor
        title="Метрика и Директ"
        initialValue={{
          metrikaCounterId: String(analytics.metrikaCounterId ?? ""),
          yandexVerificationContent: String(
            analytics.yandexVerificationContent ?? "",
          ),
        }}
        fields={[
          {
            name: "metrikaCounterId",
            label: "Номер счётчика Яндекс Метрики",
            type: "text",
          },
          {
            name: "yandexVerificationContent",
            label:
              "Код проверки Яндекса (content=… или весь meta-тег)",
            type: "text",
          },
        ]}
        onSave={async (value) => {
          const next = {
            metrikaCounterId: String(value.metrikaCounterId ?? "").trim(),
            yandexVerificationContent: extractVerificationContent(
              String(value.yandexVerificationContent ?? ""),
            ),
          };
          const response = await fetch("/api/admin/content/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analytics: next }),
          });
          if (!response.ok) {
            const payload: unknown = await response.json().catch(() => null);
            const parsed = AdminApiErrorSchema.safeParse(payload);
            throw new Error(
              parsed.success
                ? parsed.data.error.message
                : "Не удалось сохранить настройки аналитики",
            );
          }
          setAnalytics(next);
          setError(null);
        }}
      />
      {error ? (
        <p className="mt-4 font-sans text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
