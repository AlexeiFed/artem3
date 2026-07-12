"use client";

import { useState, type FormEvent } from "react";

import { SaveBar } from "./SaveBar";

export type EntityFieldType = "text" | "textarea" | "number" | "checkbox" | "url";

export interface EntityField {
  name: string;
  label: string;
  type: EntityFieldType;
}

interface EntityEditorProps {
  title: string;
  initialValue: Record<string, unknown>;
  fields: EntityField[];
  fieldErrors?: Record<string, string[]>;
  onSave(value: Record<string, unknown>): Promise<void>;
  onDelete?(): Promise<void>;
}

export function EntityEditor({
  title,
  initialValue,
  fields,
  fieldErrors,
  onSave,
  onDelete,
}: EntityEditorProps) {
  const [value, setValue] = useState<Record<string, unknown>>(initialValue);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateField(name: string, next: unknown): void {
    setValue((current) => ({ ...current, [name]: next }));
    setDirty(true);
    setFormError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await onSave(value);
      setDirty(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Не удалось сохранить.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={submit} noValidate>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl text-primary">{title}</h2>
        {onDelete ? (
          <button
            type="button"
            className="rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary"
            onClick={() => {
              if (window.confirm("Удалить запись?")) {
                void onDelete();
              }
            }}
          >
            Удалить
          </button>
        ) : null}
      </div>

      {fields.map((field) => {
        const fieldId = `field-${field.name}`;
        const errors = fieldErrors?.[field.name];
        const current = value[field.name];

        return (
          <div className="grid gap-2" key={field.name}>
            <label className="font-sans text-sm text-secondary" htmlFor={fieldId}>
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={fieldId}
                className="min-h-32 rounded-card border border-sage bg-background px-4 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
                value={typeof current === "string" ? current : ""}
                onChange={(event) => updateField(field.name, event.target.value)}
              />
            ) : field.type === "checkbox" ? (
              <input
                id={fieldId}
                type="checkbox"
                className="size-5 accent-forest"
                checked={Boolean(current)}
                onChange={(event) => updateField(field.name, event.target.checked)}
              />
            ) : (
              <input
                id={fieldId}
                type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                className="rounded-control border border-sage bg-background px-4 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
                value={
                  typeof current === "number" || typeof current === "string"
                    ? String(current)
                    : ""
                }
                onChange={(event) =>
                  updateField(
                    field.name,
                    field.type === "number"
                      ? Number(event.target.value)
                      : event.target.value,
                  )
                }
              />
            )}
            {errors?.map((message) => (
              <p className="text-sm text-secondary" key={message} role="alert">
                {message}
              </p>
            ))}
          </div>
        );
      })}

      {formError ? (
        <p className="text-sm text-secondary" role="alert">
          {formError}
        </p>
      ) : null}

      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
