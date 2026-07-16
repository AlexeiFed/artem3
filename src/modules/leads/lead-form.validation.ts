/** Formats digits into +7 (___) ___-__-__ */
export function formatRussianPhoneMask(raw: string): string {
  let digits = raw.replace(/\D/gu, "");

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  if (!digits.startsWith("7")) {
    digits = `7${digits}`;
  }
  digits = digits.slice(0, 11);

  const national = digits.slice(1);
  let formatted = "+7";

  if (national.length === 0) {
    return formatted;
  }

  formatted += ` (${national.slice(0, Math.min(3, national.length))}`;
  if (national.length < 3) {
    return formatted;
  }

  formatted += ")";
  if (national.length === 3) {
    return formatted;
  }

  formatted += ` ${national.slice(3, Math.min(6, national.length))}`;
  if (national.length <= 6) {
    return formatted;
  }

  formatted += `-${national.slice(6, Math.min(8, national.length))}`;
  if (national.length <= 8) {
    return formatted;
  }

  return `${formatted}-${national.slice(8, 10)}`;
}

export function isCompleteRussianPhoneMask(value: string): boolean {
  return /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/u.test(value.trim());
}

/** Client-side phone check aligned with server normalizeRussianPhone. */
export function validateRussianPhoneInput(raw: string): string | null {
  if (!isCompleteRussianPhoneMask(raw)) {
    return "Введите телефон в формате +7 (___) ___-__-__";
  }
  const national = raw.replace(/\D/gu, "").slice(1);
  if (!/^[3489]\d{9}$/u.test(national) || /^(\d)\1{9}$/u.test(national)) {
    return "Введите корректный российский номер";
  }
  return null;
}

const PERSON_NAME_PATTERN =
  /^[A-Za-zА-Яа-яЁё](?:[A-Za-zА-Яа-яЁё]|[ '\-](?=[A-Za-zА-Яа-яЁё]))*[A-Za-zА-Яа-яЁё]?$/u;

export function validatePersonName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/gu, " ");
  if (name.length < 2) {
    return "Введите имя (минимум 2 символа)";
  }
  if (name.length > 80) {
    return "Имя слишком длинное";
  }
  if (/\d/u.test(name)) {
    return "Имя не должно содержать цифры";
  }
  if (!PERSON_NAME_PATTERN.test(name)) {
    return "Введите корректное имя (буквы, пробел или дефис)";
  }
  return null;
}
