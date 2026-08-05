"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { formatAdminApiError } from "@/components/admin/format-admin-error";

interface ContactsEditorProps {
  initialContacts: Record<string, unknown>;
  loadError: string | null;
}

const CONTACTS_FIELD_MAP: Record<string, string> = {
  eyebrow: "eyebrow",
  header: "header",
  address: "address",
  workHours: "workHours",
  hoursNote: "hoursNote",
  responseSla: "responseSla",
  "phone.display": "phoneDisplay",
  "phone.href": "phoneHref",
  "phone.label": "phoneDisplay",
  "email.label": "emailLabel",
  "email.address": "emailAddress",
  "telegram.label": "telegramLabel",
  "telegram.url": "telegramUrl",
  "whatsapp.label": "whatsappLabel",
  "whatsapp.url": "whatsappUrl",
  "max.label": "maxLabel",
  "max.url": "maxUrl",
};

function asLink(
  value: unknown,
): { label?: string; url?: string; display?: string; href?: string; address?: string } {
  return typeof value === "object" && value !== null
    ? (value as {
        label?: string;
        url?: string;
        display?: string;
        href?: string;
        address?: string;
      })
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
  const email = asLink(contacts.email);

  return (
    <>
      <EntityEditor
        title="Контакты"
        initialValue={{
          eyebrow: String(contacts.eyebrow ?? ""),
          header: String(contacts.header ?? ""),
          address: String(contacts.address ?? ""),
          workHours: String(contacts.workHours ?? ""),
          hoursNote: String(
            contacts.hoursNote ?? "(по предварительной записи)",
          ),
          phoneDisplay: String(phone.display ?? ""),
          phoneHref: String(phone.href ?? ""),
          telegramLabel: String(telegram.label ?? "Telegram"),
          telegramUrl: String(telegram.url ?? ""),
          whatsappLabel: String(whatsapp.label ?? "WhatsApp"),
          whatsappUrl: String(whatsapp.url ?? ""),
          maxLabel: String(max.label ?? "MAX"),
          maxUrl: String(max.url ?? ""),
          emailLabel: String(email.label ?? "Email"),
          emailAddress: String(email.address ?? ""),
          responseSla: String(contacts.responseSla ?? ""),
        }}
        fields={[
          { name: "eyebrow", label: "Надзаголовок", type: "text" },
          { name: "header", label: "Заголовок", type: "text" },
          { name: "address", label: "Адрес", type: "text" },
          { name: "workHours", label: "Часы работы", type: "text" },
          {
            name: "hoursNote",
            label: "Пометка под часами",
            type: "text",
            hint: "В шапке и в контактах под часами. Пример: (по предварительной записи). Оставь пустым — строка скроется.",
          },
          {
            name: "responseSla",
            label: "Срок ответа",
            type: "text",
            hint: "В блоке контактов под списком каналов связи",
          },
          { name: "phoneDisplay", label: "Телефон (отображение)", type: "text" },
          {
            name: "phoneHref",
            label: "Телефон (tel:)",
            type: "text",
            hint: "Формат: tel:+74212931547",
          },
          { name: "emailLabel", label: "Email — подпись", type: "text" },
          {
            name: "emailAddress",
            label: "Email — адрес",
            type: "text",
            hint: "Обязательно: валидный адрес вида name@domain.ru",
          },
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
            hoursNote: String(value.hoursNote ?? "").trim(),
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
            email: {
              label: value.emailLabel,
              address: value.emailAddress,
            },
            responseSla: value.responseSla,
          };
          const response = await fetch("/api/admin/content/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contacts: nextContacts }),
          });
          if (!response.ok) {
            throw formatAdminApiError(await response.json(), {
              stripPrefix: "contacts.",
              fieldMap: CONTACTS_FIELD_MAP,
            });
          }
          setContacts(nextContacts);
          setError(null);
        }}
      />
      {error ? (
        <p className="mt-4 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
