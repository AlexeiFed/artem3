"use client";

import { useState, type FormEvent } from "react";

import { SaveBar } from "@/components/admin/SaveBar";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
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
  "seo.ogSiteName": "og:site_name",
  "seo.ogTitle": "og:title",
  "seo.ogDescription": "og:description",
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
  const seo = { ...DEFAULT_SEO_SETTINGS, ...hero.seo };

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
        <p className="font-sans text-sm text-secondary">
          Превью ссылки в Telegram / WhatsApp / VK. Не дублирует Title.
        </p>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          og:site_name
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={seo.ogSiteName}
            maxLength={200}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                seo: {
                  ...(current.seo ?? DEFAULT_SEO_SETTINGS),
                  ogSiteName: event.target.value,
                },
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          og:title
          <input
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={seo.ogTitle}
            maxLength={200}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                seo: {
                  ...(current.seo ?? DEFAULT_SEO_SETTINGS),
                  ogTitle: event.target.value,
                },
              }))
            }
          />
        </label>
        <label className="grid gap-2 font-sans text-sm text-secondary">
          og:description
          <textarea
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={seo.ogDescription}
            maxLength={320}
            onChange={(event) =>
              patchHero((current) => ({
                ...current,
                seo: {
                  ...(current.seo ?? DEFAULT_SEO_SETTINGS),
                  ogDescription: event.target.value,
                },
              }))
            }
          />
        </label>
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">Hero</h2>
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <RichTextEditor
            label="Надзаголовок"
            multiline={false}
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.eyebrow}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, eyebrow: val },
              }))
            }
          />
          <span className="text-xs">
            Необязательно. Пустое поле скроет текст, место над заголовком
            сохранится.
          </span>
        </div>
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Заголовок
          <RichTextEditor
            label="Заголовок"
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.title}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, title: val },
              }))
            }
          />
          <span className="text-xs">
            Перенос строки = новая строка на лендинге. Без переносов дефолтный
            текст разобьётся сам на 3 строки.
          </span>
        </div>
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Подзаголовок
          <RichTextEditor
            label="Подзаголовок"
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.subtitle}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, subtitle: val },
              }))
            }
          />
          <span className="text-xs">
            Строка под H1, например практики. Пустое поле скроет её — оффер
            поднимется.
          </span>
        </div>
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Оффер — строка 1
          <RichTextEditor
            label="Оффер — строка 1"
            multiline={false}
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.offerBullets[0] ?? ""}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  offerBullets: nextOfferBullets(
                    current.hero.offerBullets,
                    0,
                    val,
                  ),
                },
              }))
            }
          />
        </div>
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Оффер — строка 2
          <RichTextEditor
            label="Оффер — строка 2"
            multiline={false}
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.offerBullets[1] ?? ""}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  offerBullets: nextOfferBullets(
                    current.hero.offerBullets,
                    1,
                    val,
                  ),
                },
              }))
            }
          />
          <span className="text-xs">
            Две выгоды над кнопкой. Пустая строка скроется.
          </span>
        </div>
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
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Дисклеймер под CTA
          <RichTextEditor
            label="Дисклеймер под CTA"
            className="min-h-24 rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.hero.disclaimer}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                hero: { ...current.hero, disclaimer: val },
              }))
            }
          />
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-3xl text-primary">
          Практика в цифрах
        </h2>
        {hero.hero.metrics.map((metric, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 font-sans text-sm text-secondary">
              Значение {index + 1}
              <RichTextEditor
                label={`Значение ${index + 1}`}
                multiline={false}
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={metric.value}
                onChange={(val) =>
                  patchHero((current) => {
                    const metrics = current.hero.metrics.map((item, i) =>
                      i === index
                        ? { ...item, value: val }
                        : item,
                    );
                    return {
                      ...current,
                      hero: { ...current.hero, metrics },
                    };
                  })
                }
              />
            </div>
            <div className="grid gap-2 font-sans text-sm text-secondary">
              Подпись {index + 1}
              <RichTextEditor
                label={`Подпись ${index + 1}`}
                multiline={false}
                className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
                value={metric.label}
                onChange={(val) =>
                  patchHero((current) => {
                    const metrics = current.hero.metrics.map((item, i) =>
                      i === index
                        ? { ...item, label: val }
                        : item,
                    );
                    return {
                      ...current,
                      hero: { ...current.hero, metrics },
                    };
                  })
                }
              />
            </div>
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
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Надзаголовок
          <RichTextEditor
            label="Практика — надзаголовок"
            multiline={false}
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.servicesIntro.eyebrow}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                servicesIntro: {
                  ...current.servicesIntro,
                  eyebrow: val,
                },
              }))
            }
          />
        </div>
        <div className="grid gap-2 font-sans text-sm text-secondary">
          Заголовок
          <RichTextEditor
            label="Практика — заголовок"
            multiline={false}
            className="rounded-card border border-sage/40 bg-background px-4 py-3 text-primary"
            value={hero.servicesIntro.title}
            onChange={(val) =>
              patchHero((current) => ({
                ...current,
                servicesIntro: {
                  ...current.servicesIntro,
                  title: val,
                },
              }))
            }
          />
        </div>
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
