import type { ReactNode } from "react";

/**
 * Контурные иконки услуг. Ключ — slug из админки; неизвестный slug получает
 * нейтральный документ, поэтому новая услуга не ломает вёрстку.
 */
const ICONS: Record<string, ReactNode> = {
  razvod: (
    <>
      <circle cx="60" cy="56" r="20" />
      <circle cx="100" cy="56" r="20" />
      <path d="M80 22v68" strokeDasharray="6 7" />
    </>
  ),
  alimenty: (
    <>
      <ellipse cx="52" cy="30" rx="26" ry="10" />
      <path d="M26 30v18c0 5.5 11.6 10 26 10s26-4.5 26-10V30" />
      <path d="M26 48v18c0 5.5 11.6 10 26 10s26-4.5 26-10V48" />
      <path d="M96 54h32M116 42l12 12-12 12" />
    </>
  ),
  imushchestvo: (
    <>
      <path d="M34 50 80 18l46 32" />
      <path d="M44 50v42h72V50" />
      <path d="M80 18v74" strokeDasharray="6 7" />
    </>
  ),
  deti: (
    <>
      <circle cx="58" cy="32" r="13" />
      <path d="M36 92c0-13 10-23 22-23s22 10 22 23" />
      <circle cx="108" cy="52" r="9" />
      <path d="M93 92c0-9 6.7-16 15-16s15 7 15 16" />
    </>
  ),
  zemlya: (
    <>
      <path d="M20 84 54 30h88L108 84Z" />
      <path d="M84 30 50 84" strokeDasharray="6 7" />
    </>
  ),
  uslugi: (
    <>
      <path d="M48 14h46l22 22v58H48Z" />
      <path d="M94 14v22h22" />
      <path d="M62 54h38M62 68h20" />
      <circle cx="100" cy="76" r="11" />
    </>
  ),
};

export function ServiceIcon({
  slug,
  iconUrl,
}: {
  slug: string;
  iconUrl?: string | null;
}) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- CMS icon, local or HTTPS
      <img
        className="service-icon service-icon-image"
        src={iconUrl}
        alt=""
        aria-hidden="true"
      />
    );
  }

  return (
    <svg className="service-icon" viewBox="0 0 160 110" aria-hidden="true">
      {ICONS[slug] ?? ICONS.uslugi}
    </svg>
  );
}
