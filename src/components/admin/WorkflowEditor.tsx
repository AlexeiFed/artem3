"use client";

import { useState, type FormEvent } from "react";

import { SaveBar } from "@/components/admin/SaveBar";
import { formatAdminApiError } from "@/components/admin/format-admin-error";
import type {
  TrustBannerSettings,
  WorkflowSettings,
} from "@/modules/content/content.types";

const WORKFLOW_FIELD_LABELS: Record<string, string> = {
  "trustBanner.consultation.eyebrow": "Консультация — надзаголовок",
  "trustBanner.consultation.title": "Консультация — заголовок",
  "workflow.eyebrow": "Работа — надзаголовок",
  "workflow.title": "Работа — заголовок",
};

interface WorkflowEditorProps {
  initialTrustBanner: TrustBannerSettings;
  initialWorkflow: WorkflowSettings;
  loadError: string | null;
}

export function WorkflowEditor({
  initialTrustBanner,
  initialWorkflow,
  loadError,
}: WorkflowEditorProps) {
  const [trustBanner, setTrustBanner] = useState(initialTrustBanner);
  const [workflow, setWorkflow] = useState(initialWorkflow);
  const [error, setError] = useState(loadError);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const consultation = trustBanner.consultation;
  const benefits = consultation.benefits;
  const bullets = workflow.bullets;

  function patchConsultation(
    updater: (
      current: TrustBannerSettings["consultation"],
    ) => TrustBannerSettings["consultation"],
  ): void {
    setTrustBanner((current) => ({
      ...current,
      consultation: updater(current.consultation),
    }));
    setDirty(true);
    setError(null);
  }

  function patchWorkflow(
    updater: (current: WorkflowSettings) => WorkflowSettings,
  ): void {
    setWorkflow(updater);
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
        body: JSON.stringify({ trustBanner, workflow }),
      });
      if (!response.ok) {
        throw formatAdminApiError(await response.json(), {
          fieldLabels: WORKFLOW_FIELD_LABELS,
        });
      }
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid max-w-3xl gap-10" onSubmit={submit} noValidate>
      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Что будет на консультации
        </h2>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={consultation.eyebrow}
            onChange={(event) =>
              patchConsultation((current) => ({
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
            value={consultation.title}
            onChange={(event) =>
              patchConsultation((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </label>
        {benefits.map((benefit, index) => (
          <label
            key={`benefit-${index}`}
            className="grid gap-2 font-sans text-sm text-secondary"
          >
            Пункт {String(index + 1).padStart(2, "0")}
            <textarea
              className="min-h-20 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
              value={benefit}
              onChange={(event) =>
                patchConsultation((current) => {
                  const nextBenefits = [...current.benefits] as [
                    string,
                    string,
                    string,
                    string,
                  ];
                  nextBenefits[index] = event.target.value;
                  return { ...current, benefits: nextBenefits };
                })
              }
            />
          </label>
        ))}
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Как строится работа
        </h2>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={workflow.eyebrow}
            onChange={(event) =>
              patchWorkflow((current) => ({
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
            value={workflow.title}
            onChange={(event) =>
              patchWorkflow((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </label>
        {bullets.map((bullet, index) => (
          <div key={`bullet-${index}`} className="grid gap-3 rounded-card border border-sage/25 p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-sage">
              Шаг {String(index + 1).padStart(2, "0")}
            </p>
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Заголовок
              <input
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={bullet.title}
                onChange={(event) =>
                  patchWorkflow((current) => {
                    const nextBullets = current.bullets.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, title: event.target.value }
                        : item,
                    ) as WorkflowSettings["bullets"];
                    return { ...current, bullets: nextBullets };
                  })
                }
              />
            </label>
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Текст
              <textarea
                className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={bullet.copy}
                onChange={(event) =>
                  patchWorkflow((current) => {
                    const nextBullets = current.bullets.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, copy: event.target.value }
                        : item,
                    ) as WorkflowSettings["bullets"];
                    return { ...current, bullets: nextBullets };
                  })
                }
              />
            </label>
          </div>
        ))}
      </section>

      {error ? (
        <p className="font-sans text-sm text-secondary" role="alert">
          {error}
        </p>
      ) : null}

      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
