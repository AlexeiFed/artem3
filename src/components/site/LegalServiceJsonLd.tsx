import type { LandingData } from "@/modules/content/content.types";
import { buildLegalServiceJsonLd } from "@/modules/content/legal-service-json-ld";

const PREVIEW_SITE_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return PREVIEW_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return PREVIEW_SITE_URL;
  }
}

export function LegalServiceJsonLd({
  contacts,
}: {
  contacts: LandingData["contacts"];
}) {
  const siteUrl = resolveSiteUrl();
  const jsonLd = buildLegalServiceJsonLd({
    siteUrl,
    name: "Артём Сысуев — семейный и имущественный юрист",
    telephone: contacts.phone.href.replace(/^tel:/, ""),
    streetAddress: contacts.address.replace(/^г\.\s*Хабаровск,\s*/i, ""),
    addressLocality: "Хабаровск",
    postalCode: "680000",
    latitude: contacts.map.latitude,
    longitude: contacts.map.longitude,
    imageUrl: new URL("/media/artem-desk-cases.jpg", siteUrl).toString(),
    sameAs: [
      "https://vk.com/tvoe_pravo_tut",
      "https://2gis.ru/khabarovsk/firm/70000001034709262",
      contacts.map.externalUrl,
    ],
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
