import { describe, expect, it } from "vitest";

import {
  heroMarkupToEditorHtml,
  sanitizeHeroMarkup,
  stripHeroMarkup,
} from "./hero-markup";

describe("hero markup", () => {
  it("keeps bold, italic and brass spans", () => {
    expect(
      sanitizeHeroMarkup(
        'Переговоры или суд — выберем <span class="text-brass">лучший путь</span>',
      ),
    ).toBe(
      'Переговоры или суд — выберем <span class="text-brass">лучший путь</span>',
    );
    expect(sanitizeHeroMarkup("<b>Ж</b><i>К</i>")).toBe("<b>Ж</b><i>К</i>");
  });

  it("strips scripts and unknown attributes", () => {
    expect(
      sanitizeHeroMarkup(
        '<span class="text-brass" onclick="alert(1)">путь</span><script>alert(1)</script>',
      ),
    ).toBe('<span class="text-brass">путь</span>');
  });

  it("turns editor line breaks into newlines", () => {
    expect(sanitizeHeroMarkup("Семейный юрист<br>в Хабаровске")).toBe(
      "Семейный юрист\nв Хабаровске",
    );
    expect(heroMarkupToEditorHtml("A\nB")).toBe("A<br>B");
  });

  it("strips tags for aria labels", () => {
    expect(
      stripHeroMarkup(
        'Семейный юрист <span class="text-brass">в Хабаровске</span>',
      ),
    ).toBe("Семейный юрист в Хабаровске");
  });
});
