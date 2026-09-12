import type { LandingData } from "@/modules/content/content.types";
import { buildFaqPageJsonLd } from "@/modules/content/faq-page-json-ld";
import { serializeJsonLd } from "@/modules/content/legal-service-json-ld";

export function FaqPageJsonLd({
  items,
}: {
  items: LandingData["faqs"];
}) {
  const jsonLd = buildFaqPageJsonLd(
    items.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
