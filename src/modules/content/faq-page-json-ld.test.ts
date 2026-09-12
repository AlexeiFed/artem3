import { describe, expect, it } from "vitest";

import { buildFaqPageJsonLd } from "./faq-page-json-ld";
import { serializeJsonLd } from "./legal-service-json-ld";

describe("buildFaqPageJsonLd", () => {
  it("builds schema.org FAQPage from published questions", () => {
    const jsonLd = buildFaqPageJsonLd([
      {
        question: "Можно ли развестись без присутствия второго супруга?",
        answer: "Да. Суд вправе рассмотреть дело без него.",
      },
      {
        question: "Как делится квартира в ипотеке?",
        answer: "Делятся и доля, и долг.",
      },
    ]);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "Можно ли развестись без присутствия второго супруга?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Да. Суд вправе рассмотреть дело без него.",
        },
      },
      {
        "@type": "Question",
        name: "Как делится квартира в ипотеке?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Делятся и доля, и долг.",
        },
      },
    ]);
  });

  it("escapes FAQ answers so they cannot break out of the script tag", () => {
    const serialized = serializeJsonLd(
      buildFaqPageJsonLd([
        {
          question: "Вопрос",
          answer: "Ответ</script><script>alert(1)",
        },
      ]),
    );

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c");
  });
});
