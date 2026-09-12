import { sanitizeHeroMarkup, stripHeroMarkup } from "@/lib/hero-markup";
import type { LandingData } from "@/modules/content/content.types";

import { ServiceIcon } from "./ServiceIcon";

function cardPreviewLines(
  preview: readonly [string, string] | undefined,
): string[] {
  if (!preview) return [];
  return preview.filter((line) => stripHeroMarkup(line).length > 0);
}

export function QuickAccess({
  items,
  services,
}: {
  items: LandingData["quickLinks"];
  services: LandingData["services"];
}) {
  const bySlug = new Map(services.map((service) => [service.slug, service]));

  return (
    <nav className="quick shell section" aria-label="Быстрый выбор услуги">
      <p className="eyebrow">С чем помочь</p>
      <div className="quick-grid" data-count={items.length}>
        {items.map((item, index) => {
          const service = bySlug.get(item.slug);
          const preview = cardPreviewLines(service?.previewSituations);
          return (
            <a key={item.slug} href={item.href} className="quick-card">
              <span className="quick-card-top">
                <ServiceIcon
                  slug={item.slug}
                  iconUrl={service?.iconUrl ?? null}
                  sizes="32px"
                />
                <span className="quick-card-num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="quick-card-service">
                <strong>{`${item.label} `}</strong>
                {preview.length > 0 ? (
                  <span className="quick-card-situations">
                    {preview.map((line, index) => (
                      <span
                        key={`${item.slug}-${index}`}
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHeroMarkup(line),
                        }}
                      />
                    ))}
                  </span>
                ) : null}
              </span>
              <span className="quick-card-more">
                <span className="quick-card-more-label">Подробнее</span>
                <span className="quick-card-arrow" aria-hidden="true">
                  →
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
