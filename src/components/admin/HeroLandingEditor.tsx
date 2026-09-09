"use client";

import { useState, type FormEvent } from "react";

import { SaveBar } from "@/components/admin/SaveBar";
import { formatAdminApiError } from "@/components/admin/format-admin-error";
import { DEFAULT_SEO_SETTINGS } from "@/modules/content/content.schemas";
import type { HeroSettings } from "@/modules/content/content.types";

interface HeroLandingEditorProps {
  initialHero: HeroSettings;
  loadError: string | null;
}

function nextOfferBullets(
  bullets: HeroSettings["hero"]["offerBullets"],
  index: 0 | 1,
  value: string,
): [string, string] {
  return index === 0
    ? [value, bullets[1] ?? ""]
    : [bullets[0] ?? "", value];
}

const HERO_FIELD_LABELS: Record<string, string> = {
  "hero.eyebrow": "Надзаголовок",
  "hero.title": "Заголовок",
  "hero.subtitle": "Подзаголовок",
  "hero.offerBullets.0": "Оффер — строка 1",
  "hero.offerBullets.1": "Оффер — строка 2",
  "hero.disclaimer": "Дисклеймер под CTA",
  "seo.title": "Title",
  "seo.description": "Description",
  "servicesIntro.eyebrow": "Практика — надзаголовок",
  "servicesIntro.title": "Практика — заголовок",
};

export function HeroLandingEditor({
  initialHero,
  loadError,
}: HeroLandingEditorProps) {
  const [hero, setHero] = useState(initialHero);
  const [error, setError] = useState(loadError);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const seo = hero.seo ?? DEFAULT_SEO_SETTINGS;

  function patchHero(
    updater: (current: HeroSettings) => HeroSettings,
  ): void {
    setHero(updater);
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
        throw formatAdminApiError(await response.json().catch(() => null), {
          stripPrefix: "hero.",
          fieldLabels: HERO_FIELD_LABELS,
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
    <form className="grid max-w-3xl gap-8" onSubmit={submit} noValidate>
      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Title и Description
        </h2>
        <p className="font-sans text-sm text-secondary">
          Вкладка браузера и сниппет в поиске. Яндекс иногда подменяет
          Description карточкой организации (адрес и часы из «Контактов»).
        </p>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Title
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={seo.title}
            maxLength={200}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                seo: {
                  ...(current.seo ?? DEFAULT_SEO_SETTINGS),
                  title: event.target.value,
                },
              }))
            }
          />
          <span className="text-xs">До 200 символов. Сейчас {seo.title.length}.</span>
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Description
          <textarea
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={seo.description}
            maxLength={320}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                seo: {
                  ...(current.seo ?? DEFAULT_SEO_SETTINGS),
                  description: event.target.value,
                },
              }))
            }
          />
          <span className="text-xs">
            До 320 символов. Сейчас {seo.description.length}.
          </span>
        </label>
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">Hero</h2>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.eyebrow}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, eyebrow: event.target.value },
              }))
            }
          />
          <span className="text-xs">
            Необязательно. Пустое поле скроет строку — H1 поднимется на её
            место.
          </span>
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Заголовок
          <textarea
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.title}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, title: event.target.value },
              }))
            }
          />
          <span className="text-xs">
            Перенос строки = новая строка на лендинге. Без переносов дефолтный
            текст разобьётся сам на 3 строки.
          </span>
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Подзаголовок
          <textarea
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.subtitle}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, subtitle: event.target.value },
              }))
            }
          />
          <span className="text-xs">
            Строка под H1, например практики. Пустое поле скроет её — оффер
            поднимется.
          </span>
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Оффер — строка 1
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.offerBullets[0] ?? ""}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  offerBullets: nextOfferBullets(
                    current.hero.offerBullets,
                    0,
                    event.target.value,
                  ),
                },
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Оффер — строка 2
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.offerBullets[1] ?? ""}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  offerBullets: nextOfferBullets(
                    current.hero.offerBullets,
                    1,
                    event.target.value,
                  ),
                },
              }))
            }
          />
          <span className="text-xs">
            Две выгоды над кнопкой. Пустая строка скроется.
          </span>
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Кнопка CTA
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.cta.label}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  cta: { ...current.hero.cta, label: event.target.value },
                },
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Дисклеймер под CTA
          <textarea
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.disclaimer}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, disclaimer: event.target.value },
              }))
            }
          />
        </label>
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Практика в цифрах
        </h2>
        {hero.hero.metrics.map((metric, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Значение {index + 1}
              <input
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={metric.value}
                onChange={(event) =>
                  patchHero((current) => {
                    const metrics = current.hero.metrics.map((item, i) =>
                      i === index
                        ? { ...item, value: event.target.value }
                        : item,
                    );
                    return {
                      ...current,
                      hero: { ...current.hero, metrics },
                    };
                  })
                }
              />
            </label>
            <label className="grid gap-2 font-sans text-sm text-secondary">
              Подпись {index + 1}
              <input
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={metric.label}
                onChange={(event) =>
                  patchHero((current) => {
                    const metrics = current.hero.metrics.map((item, i) =>
                      i === index
                        ? { ...item, label: event.target.value }
                        : item,
                    );
                    return {
                      ...current,
                      hero: { ...current.hero, metrics },
                    };
                  })
                }
              />
            </label>
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Блок «Практика» (услуги)
        </h2>
        <p className="font-sans text-sm text-secondary">
          Карточки и вкладки берутся из раздела «Услуги». Здесь — заголовки
          секции.
        </p>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.servicesIntro.eyebrow}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                servicesIntro: {
                  ...current.servicesIntro,
                  eyebrow: event.target.value,
                },
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          Заголовок
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.servicesIntro.title}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                servicesIntro: {
                  ...current.servicesIntro,
                  title: event.target.value,
                },
              }))
            }
          />
        </label>
      </section>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      <SaveBar dirty={dirty} saving={saving} />
    </form>
  );
}
