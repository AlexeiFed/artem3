const PREVIEWS: Record<string, readonly [string, string]> = {
  razvod: ["Без согласия супруга", "При наличии детей"],
  alimenty: ["Взыскание алиментов", "Изменение размера"],
  imushchestvo: ["Квартира, дом или автомобиль", "Ипотека и общие долги"],
  deti: ["Место жительства ребёнка", "Порядок общения"],
  uslugi: ["Юридические консультации", "Подготовка документов"],
  zemlya: ["Оформление участка", "Споры по границам"],
};

export function quickAccessPreview(
  slug: string,
): readonly [string, string] | undefined {
  return PREVIEWS[slug];
}

export function defaultPreviewSituations(slug: string): [string, string] {
  const preview = quickAccessPreview(slug);
  return preview ? [preview[0], preview[1]] : ["", ""];
}
