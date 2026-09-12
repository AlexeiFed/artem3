const JCUKEN = "ёйцукенгшщзхъфывапролджэячсмитьбюЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ";
const QWERTY = "`qwertyuiop[]asdfghjkl;'zxcvbnm,.~QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>";

const JCUKEN_TO_QWERTY: Readonly<Record<string, string>> = Object.fromEntries(
  [...JCUKEN].flatMap((char, index) => {
    const latin = QWERTY[index];
    return latin === undefined ? [] : [[char, latin]];
  }),
);

const CYRILLIC = /[\u0400-\u04FF]/u;

/** NFC + йцукен→qwerty, чтобы набор вручную совпадал с вставкой латиницы. */
export function normalizeAdminPassword(password: string): string {
  const normalized = password.normalize("NFC");
  if (!CYRILLIC.test(normalized)) {
    return normalized;
  }

  return [...normalized]
    .map((char) => JCUKEN_TO_QWERTY[char] ?? char)
    .join("");
}
