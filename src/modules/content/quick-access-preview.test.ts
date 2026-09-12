import { describe, expect, it } from "vitest";

import { defaultPreviewSituations, quickAccessPreview } from "./quick-access-preview";

describe("quickAccessPreview", () => {
  it("returns two short situations for known slugs", () => {
    expect(quickAccessPreview("razvod")).toEqual([
      "Без согласия супруга",
      "При наличии детей",
    ]);
    expect(quickAccessPreview("alimenty")).toEqual([
      "Взыскание алиментов",
      "Изменение размера",
    ]);
    expect(quickAccessPreview("imushchestvo")).toEqual([
      "Квартира, дом или автомобиль",
      "Ипотека и общие долги",
    ]);
    expect(quickAccessPreview("deti")).toEqual([
      "Место жительства ребёнка",
      "Порядок общения",
    ]);
    expect(quickAccessPreview("uslugi")).toEqual([
      "Юридические консультации",
      "Подготовка документов",
    ]);
    expect(quickAccessPreview("zemlya")).toEqual([
      "Оформление участка",
      "Споры по границам",
    ]);
  });

  it("does not invent copy for an unknown slug", () => {
    expect(quickAccessPreview("custom-slug")).toBeUndefined();
    expect(defaultPreviewSituations("custom-slug")).toEqual(["", ""]);
  });
});
