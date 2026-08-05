"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { AdminFormError } from "./format-admin-error";
import { SaveBar } from "./SaveBar";

export type EntityFieldType = "text" | "textarea" | "number" | "checkbox" | "url";

export interface EntityField {
  name: string;
  label: string;
  type: EntityFieldType;
  hint?: string;
}

interface EntityEditorProps {
  title: string;
  initialValue: Record<string, unknown>;
  fields: EntityField[];
  fieldErrors?: Record<string, string[]>;
  onSave(value: Record<string, unknown>): Promise<void>;
  onDelete?(): Promise<void>;
  onToggleVisibility?(): Promise<void>;
  visibilityLabel?: string;
}

export function EntityEditor({
  title,
  initialValue,
  fields,
  fieldErrors,
  onSave,
  onDelete,
  onToggleVisibility,
  visibilityLabel = "Скрыть",
}: EntityEditorProps) {
  const [value, setValue] = useState<Record<string, unknown>>(initialValue);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [localFieldErrors, setLocalFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const alertRef = useRef<HTMLDivElement>(null);

  const mergedFieldErrors = {
    ...fieldErrors,
    ...localFieldErrors,
  };

  useEffect(() => {
    if (formError) {
      alertRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [formError]);

  function updateField(name: string, next: unknown): void {
    setValue((current) => ({ ...current, [name]: next }));
    setDirty(true);
    setFormError(null);
    setLocalFieldErrors((current) => {
      if (!(name in current)) {
        return current;
      }
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setLocalFieldErrors({});
    try {
      await onSave(value);
      setDirty(false);
    } catch (error) {
      if (error instanceof AdminFormError) {
        setFormError(error.message);
        setLocalFieldErrors(error.fields);
      } else {
        setFormError(
          error instanceof Error ? error.message : "Не удалось сохранить.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={submit} noValidate>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl text-primary">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {onToggleVisibility ? (
            <button
              type="button"
              className="rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary"
              onClick={() => {
                void onToggleVisibility();
              }}
            >
              {visibilityLabel}
            </button>
          ) : null}
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
      </div>

      {formError ? (
        <div
          ref={alertRef}
          className="rounded-card border border-error bg-background px-4 py-3 shadow-lift"
          role="alert"
        >
          <p className="font-sans text-sm font-semibold text-error">
            Ошибка сохранения
          </p>
          <p className="mt-1 font-sans text-sm text-error">{formError}</p>
          <p className="mt-2 font-sans text-sm text-secondary">
            Исправьте поля с подсветкой ниже и нажмите «Сохранить» снова.
          </p>
        </div>
      ) : null}

      {fields.map((field) => {
        const fieldId = `field-${field.name}`;
        const errors = mergedFieldErrors[field.name];
        const hasError = Boolean(errors?.length);
        const current = value[field.name];
        const controlClass = hasError
          ? "border-error focus-visible:ring-error"
          : "border-sage focus-visible:ring-forest";

        return (
          <div className="grid gap-2" key={field.name}>
            <label className="font-sans text-sm text-secondary" htmlFor={fieldId}>
              {field.label}
            </label>
            {field.hint ? (
              <p className="font-sans text-xs text-secondary">{field.hint}</p>
            ) : null}
            {field.type === "textarea" ? (
              <textarea
                id={fieldId}
                aria-invalid={hasError}
                className={`min-h-48 rounded-card border bg-background px-4 py-3 text-primary outline-none focus-visible:ring-2 ${controlClass}`}
                value={typeof current === "string" ? current : ""}
                onChange={(event) => updateField(field.name, event.target.value)}
              />
            ) : field.type === "checkbox" ? (
              <input
                id={fieldId}
                type="checkbox"
                aria-invalid={hasError}
                className="size-5 accent-forest"
                checked={Boolean(current)}
                onChange={(event) => updateField(field.name, event.target.checked)}
              />
            ) : (
              <input
                id={fieldId}
                type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                aria-invalid={hasError}
                className={`rounded-control border bg-background px-4 py-3 text-primary outline-none focus-visible:ring-2 ${controlClass}`}
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
              <p className="text-sm text-error" key={message} role="alert">
                {message}
              </p>
            ))}
          </div>
        );
      })}

      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
