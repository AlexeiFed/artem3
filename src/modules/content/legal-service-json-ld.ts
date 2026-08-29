export interface LegalServiceJsonLdInput {
  siteUrl: string;
  name: string;
  telephone: string;
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  sameAs: string[];
}

export function buildLegalServiceJsonLd(input: LegalServiceJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: input.name,
    image: input.imageUrl,
    url: input.siteUrl,
    telephone: input.telephone,
    priceRange: "₽₽",
    address: {
      "@type": "PostalAddress",
      streetAddress: input.streetAddress,
      addressLocality: input.addressLocality,
      postalCode: input.postalCode,
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
      opens: "09:00",
      closes: "18:00",
    },
    areaServed: {
      "@type": "City",
      name: input.addressLocality,
    },
    sameAs: input.sameAs,
  } as const;
}

/** JSON-LD inside <script>: escape `<` so CMS text cannot close the tag. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

