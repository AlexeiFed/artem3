import type { LandingData } from "@/modules/content/content.types";

export function QuickAccess({
  items,
}: {
  items: LandingData["quickLinks"];
}) {
  return (
    <nav className="quick shell section" aria-label="Быстрый выбор услуги">
      <p className="eyebrow">С чем помочь</p>
      <div className="quick-grid" data-count={items.length}>
        {items.map((item, index) => (
          <a key={item.slug} href={item.href} className="quick-card">
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.label}</strong>
            <span aria-hidden="true">↘</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
