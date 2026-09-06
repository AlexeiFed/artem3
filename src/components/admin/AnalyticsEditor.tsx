"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { formatAdminApiError } from "@/components/admin/format-admin-error";
import { extractYandexVerificationContent } from "@/modules/content/yandex-verification";

interface AnalyticsEditorProps {
  initialAnalytics: {
    metrikaCounterId?: string;
    yandexVerificationContent?: string;
  };
  loadError: string | null;
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
        Счётчик Метрики и код проверки сайта для Яндекс Директа / Вебмастера.
        Это публичные маркетинговые коды — не пароли и не токены API. Цель{" "}
        <code className="text-primary">lead_success</code> создаётся в кабинете
        Метрики (JavaScript-событие). Для Вебмастера также доступны{" "}
        <code className="text-primary">/robots.txt</code> и{" "}
        <code className="text-primary">/sitemap.xml</code>. HTML-файл проверки
        отдаётся с{" "}
        <code className="text-primary">/yandex_…html</code>.
      </p>
      <EntityEditor
        key={`${analytics.metrikaCounterId}|${analytics.yandexVerificationContent}`}
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
            label: "Код проверки Яндекса",
            hint: "Вставьте content, весь meta-тег или HTML-файл с Verification: …",
            type: "textarea",
          },
        ]}
        onSave={async (value) => {
          const next = {
            metrikaCounterId: String(value.metrikaCounterId ?? "").trim(),
            yandexVerificationContent: extractYandexVerificationContent(
              String(value.yandexVerificationContent ?? ""),
            ),
          };
          const response = await fetch("/api/admin/content/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analytics: next }),
          });
          if (!response.ok) {
            throw formatAdminApiError(await response.json().catch(() => null), {
              stripPrefix: "analytics.",
              fieldLabels: {
                metrikaCounterId: "Номер счётчика Яндекс Метрики",
                yandexVerificationContent: "Код проверки Яндекса",
              },
            });
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
