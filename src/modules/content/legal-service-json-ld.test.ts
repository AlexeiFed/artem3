import { describe, expect, it } from "vitest";

import {
  buildLegalServiceJsonLd,
  serializeJsonLd,
} from "./legal-service-json-ld";

describe("buildLegalServiceJsonLd", () => {
  it("builds schema.org LegalService for Khabarovsk geo SEO", () => {
    const jsonLd = buildLegalServiceJsonLd({
      siteUrl: "https://example.com",
      name: "Артём Сысуев",
      telephone: "+74212931547",
      streetAddress: "ул. Ленина, 22, офис 12",
      addressLocality: "Хабаровск",
      postalCode: "680000",
      latitude: 48.47085,
      longitude: 135.07446,
      imageUrl: "https://example.com/media/artem-desk-cases.jpg",
      sameAs: [
        "https://vk.com/tvoe_pravo_tut",
        "https://2gis.ru/khabarovsk/firm/70000001034709262",
      ],
    });

    expect(jsonLd["@type"]).toBe("LegalService");
    expect(jsonLd.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Хабаровск",
      addressCountry: "RU",
    });
    expect(jsonLd.geo).toMatchObject({
      "@type": "GeoCoordinates",
      latitude: 48.47085,
      longitude: 135.07446,
    });
    expect(jsonLd.areaServed).toMatchObject({
      "@type": "City",
      name: "Хабаровск",
    });
  });

  it("escapes < so JSON-LD cannot break out of a script tag", () => {
    const jsonLd = buildLegalServiceJsonLd({
      siteUrl: "https://example.com",
      name: "Артём Сысуев",
      telephone: "+74212931547",
      streetAddress: "ул. Ленина</script><script>alert(1)",
      addressLocality: "Хабаровск",
      postalCode: "680000",
      latitude: 48.47085,
      longitude: 135.07446,
      imageUrl: "https://example.com/media/artem-desk-cases.jpg",
      sameAs: ["https://example.com/?q=</script>"],
    });

    const serialized = serializeJsonLd(jsonLd);
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c");
  });
});
