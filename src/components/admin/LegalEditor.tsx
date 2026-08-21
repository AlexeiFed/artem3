"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

interface LegalEditorProps {
  initialLegal: Record<string, unknown>;
  loadError: string | null;
}

export function LegalEditor({ initialLegal, loadError }: LegalEditorProps) {
  const [legal, setLegal] = useState(initialLegal);
  const [error, setError] = useState(loadError);

  return (
    <>
      <EntityEditor
        title="Правовые тексты"
        initialValue={{
          entityText: String(legal.entityText ?? ""),
          privacyText: String(legal.privacyText ?? ""),
          cookiesConsentText: String(legal.cookiesConsentText ?? ""),
          personalDataText: String(legal.personalDataText ?? ""),
          termsText: String(legal.termsText ?? ""),
          nonPublicOfferText: String(legal.nonPublicOfferText ?? ""),
        }}
        fields={[
          { name: "entityText", label: "Реквизиты в подвале", type: "textarea" },
          {
            name: "privacyText",
            label: "Политика конфиденциальности (/privacy)",
            type: "textarea",
          },
          {
            name: "cookiesConsentText",
            label: "Согласие на cookies (/cookies)",
            type: "textarea",
          },
          {
            name: "personalDataText",
            label: "Согласие на обработку ПДн (/personal-data)",
            type: "textarea",
          },
          {
            name: "termsText",
            label: "Условия обращения через сайт (/usloviya)",
            type: "textarea",
          },
          {
            name: "nonPublicOfferText",
            label: "Отказ от оферты",
            type: "textarea",
          },
        ]}
        onSave={async (value) => {
          const nextLegal = {
            entityText: value.entityText,
            privacyText: value.privacyText,
            cookiesConsentText: value.cookiesConsentText,
            personalDataText: value.personalDataText,
            termsText: value.termsText,
            nonPublicOfferText: value.nonPublicOfferText,
          };
          const response = await fetch("/api/admin/content/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ legal: nextLegal }),
          });
          if (!response.ok) {
            const parsed = AdminApiErrorSchema.safeParse(await response.json());
            throw new Error(
              parsed.success
                ? parsed.data.error.message
                : "Ошибка сохранения",
            );
          }
          setLegal(nextLegal);
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
