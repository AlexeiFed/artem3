"use client";

import { useState } from "react";

import { EntityEditor } from "@/components/admin/EntityEditor";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";

interface ContactsEditorProps {
  initialContacts: Record<string, unknown>;
  loadError: string | null;
}

export function ContactsEditor({
  initialContacts,
  loadError,
}: ContactsEditorProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [error, setError] = useState(loadError);
  const phone =
    typeof contacts.phone === "object" && contacts.phone !== null
      ? (contacts.phone as { display?: string; href?: string; label?: string })
      : {};

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
        }}
        fields={[
          { name: "eyebrow", label: "Надзаголовок", type: "text" },
          { name: "header", label: "Заголовок", type: "text" },
          { name: "address", label: "Адрес", type: "text" },
          { name: "workHours", label: "Часы работы", type: "text" },
          { name: "phoneDisplay", label: "Телефон (отображение)", type: "text" },
          { name: "phoneHref", label: "Телефон (tel:)", type: "text" },
        ]}
        onSave={async (value) => {
          const nextContacts = {
            ...contacts,
            eyebrow: value.eyebrow,
            header: value.header,
            address: value.address,
            workHours: value.workHours,
            phone: {
              ...phone,
              display: value.phoneDisplay,
              href: value.phoneHref,
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
