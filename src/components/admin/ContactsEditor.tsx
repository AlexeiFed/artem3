"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

interface ContactsEditorProps {
  initialContacts: Record<string, unknown>;
  loadError: string | null;
}

function asLink(
  value: unknown,
): { label?: string; url?: string; display?: string; href?: string } {
  return typeof value === "object" && value !== null
    ? (value as { label?: string; url?: string; display?: string; href?: string })
    : {};
}

export function ContactsEditor({
  initialContacts,
  loadError,
}: ContactsEditorProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [error, setError] = useState(loadError);
  const phone = asLink(contacts.phone);
  const telegram = asLink(contacts.telegram);
  const whatsapp = asLink(contacts.whatsapp);
  const max = asLink(contacts.max);

  return (
    <>
      <EntityEditor
        title="Контакты"
        initialValue={{
          eyebrow: String(contacts.eyebrow ?? ""),
          header: String(contacts.header ?? ""),
          address: String(contacts.address ?? ""),
          workHours: String(contacts.workHours ?? ""),
          phoneDisplay: String(phone.display ?? ""),
          phoneHref: String(phone.href ?? ""),
          telegramLabel: String(telegram.label ?? "Telegram"),
          telegramUrl: String(telegram.url ?? ""),
          whatsappLabel: String(whatsapp.label ?? "WhatsApp"),
          whatsappUrl: String(whatsapp.url ?? ""),
          maxLabel: String(max.label ?? "MAX"),
          maxUrl: String(max.url ?? ""),
        }}
        fields={[
          { name: "eyebrow", label: "Надзаголовок", type: "text" },
          { name: "header", label: "Заголовок", type: "text" },
          { name: "address", label: "Адрес", type: "text" },
          { name: "workHours", label: "Часы работы", type: "text" },
          { name: "phoneDisplay", label: "Телефон (отображение)", type: "text" },
          { name: "phoneHref", label: "Телефон (tel:)", type: "text" },
          { name: "telegramLabel", label: "Telegram — подпись", type: "text" },
          {
            name: "telegramUrl",
            label: "Telegram — ссылка (telegram.me/…)",
            type: "url",
          },
          { name: "whatsappLabel", label: "WhatsApp — подпись", type: "text" },
          { name: "whatsappUrl", label: "WhatsApp — ссылка", type: "url" },
          { name: "maxLabel", label: "MAX — подпись", type: "text" },
          { name: "maxUrl", label: "MAX — ссылка", type: "url" },
        ]}
        onSave={async (value) => {
          const telegramUrl = String(value.telegramUrl ?? "").replace(
            /^https:\/\/t\.me\//u,
            "https://telegram.me/",
          );
          const nextContacts = {
            ...contacts,
            eyebrow: value.eyebrow,
            header: value.header,
            address: value.address,
            workHours: value.workHours,
            phone: {
              ...phone,
              label: phone.label ?? "Телефон",
              display: value.phoneDisplay,
              href: value.phoneHref,
            },
            telegram: {
              label: value.telegramLabel,
              url: telegramUrl,
            },
            whatsapp: {
              label: value.whatsappLabel,
              url: value.whatsappUrl,
            },
            max: {
              label: value.maxLabel,
              url: value.maxUrl,
            },
          };
          const response = await fetch("/api/admin/content/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contacts: nextContacts }),
          });
          if (!response.ok) {
            const parsed = AdminApiErrorSchema.safeParse(await response.json());
            throw new Error(
              parsed.success
                ? parsed.data.error.message
                : "Ошибка сохранения",
            );
          }
          setContacts(nextContacts);
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
