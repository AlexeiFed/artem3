"use client";

import { useState, type FormEvent } from "react";

import { SaveBar } from "@/components/admin/SaveBar";
import { AdminApiErrorSchema } from "@/modules/content/admin-content.schemas";
import type { HeroSettings } from "@/modules/content/content.types";

interface XrayEditorProps {
  initialHero: HeroSettings;
  loadError: string | null;
}

export function XrayEditor({ initialHero, loadError }: XrayEditorProps) {
  const [hero, setHero] = useState(initialHero);
  const [error, setError] = useState(loadError);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const risks = hero.hiddenRisks;

  function patchRisks(
    updater: (current: HeroSettings["hiddenRisks"]) => HeroSettings["hiddenRisks"],
  ): void {
    setHero((current) => ({
      ...current,
      hiddenRisks: updater(current.hiddenRisks),
    }));
    setDirty(true);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/content/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero }),
      });
      if (!response.ok) {
        const parsed = AdminApiErrorSchema.safeParse(await response.json());
        throw new Error(
          parsed.success ? parsed.data.error.message : "Ошибка сохранения",
        );
      }
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid max-w-3xl gap-8" onSubmit={submit} noValidate>
      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">Рентген договора</h2>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={risks.eyebrow}
            onChange={(event) =>
              patchRisks((current) => ({
                ...current,
                eyebrow: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Заголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={risks.title}
            onChange={(event) =>
              patchRisks((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Текст
          <textarea
            className="min-h-32 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={risks.copy}
            onChange={(event) =>
              patchRisks((current) => ({
                ...current,
                copy: event.target.value,
              }))
            }
          />
        </label>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-primary">
            Строки документа
          </h2>
          <button
            type="button"
            className="w-fit rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary"
            disabled={risks.documentLines.length >= 8}
            onClick={() =>
              patchRisks((current) => ({
                ...current,
                documentLines: [
                  ...current.documentLines,
                  "Новая строка соглашения",
                ],
              }))
            }
          >
            Добавить строку
          </button>
        </div>
        {risks.documentLines.map((line, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Строка {index + 1}
              <input
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={line}
                onChange={(event) =>
                  patchRisks((current) => {
                    const documentLines = current.documentLines.map((item, i) =>
                      i === index ? event.target.value : item,
                    );
                    return { ...current, documentLines };
                  })
                }
              />
            </label>
            <button
              type="button"
              className="self-end rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary disabled:opacity-40"
              disabled={risks.documentLines.length <= 3}
              onClick={() =>
                patchRisks((current) => ({
                  ...current,
                  documentLines: current.documentLines.filter(
                    (_, i) => i !== index,
                  ),
                }))
              }
            >
              Удалить
            </button>
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="font-display text-3xl text-primary">
              Опасные условия
            </h2>
            <p className="font-sans text-sm text-secondary">
              На лендинге в блоке «Рентген договора»: наведите курсор на белую
              карточку — проявятся строки соглашения и список опасных условий.
              На телефоне блок открыт сразу.
            </p>
          </div>
          <button
            type="button"
            className="w-fit shrink-0 rounded-card border border-sage px-4 py-2 font-sans text-sm text-secondary"
            disabled={risks.toxicClauses.length >= 6}
            onClick={() =>
              patchRisks((current) => ({
                ...current,
                toxicClauses: [
                  ...current.toxicClauses,
                  {
                    clause: "«Новая формулировка»",
                    risk: "Опишите риск для клиента.",
                  },
                ],
              }))
            }
          >
            Добавить условие
          </button>
        </div>
        {risks.toxicClauses.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-card border border-sage/30 p-4"
          >
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Формулировка
              <input
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={item.clause}
                onChange={(event) =>
                  patchRisks((current) => {
                    const toxicClauses = current.toxicClauses.map((clause, i) =>
                      i === index
                        ? { ...clause, clause: event.target.value }
                        : clause,
                    );
                    return { ...current, toxicClauses };
                  })
                }
              />
            </label>
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Риск
              <textarea
                className="min-h-20 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={item.risk}
                onChange={(event) =>
                  patchRisks((current) => {
                    const toxicClauses = current.toxicClauses.map((clause, i) =>
                      i === index
                        ? { ...clause, risk: event.target.value }
                        : clause,
                    );
                    return { ...current, toxicClauses };
                  })
                }
              />
            </label>
            <button
              type="button"
              className="w-fit rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary disabled:opacity-40"
              disabled={risks.toxicClauses.length <= 2}
              onClick={() =>
                patchRisks((current) => ({
                  ...current,
                  toxicClauses: current.toxicClauses.filter(
                    (_, i) => i !== index,
                  ),
                }))
              }
            >
              Удалить условие
            </button>
          </div>
        ))}
      </section>

      {error ? (
        <p className="text-sm text-secondary" role="alert">
          {error}
        </p>
      ) : null}
      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
