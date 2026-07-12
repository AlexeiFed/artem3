const ALLOWED_PHONE_CHARACTERS = /^\+?[\d\s()-]+$/u;

export class InvalidRussianPhoneError extends Error {
  constructor() {
    super("Invalid Russian phone");
    this.name = "InvalidRussianPhoneError";
  }
}

export function normalizeRussianPhone(input: string): string {
  const value = input.trim();

  if (!value || !ALLOWED_PHONE_CHARACTERS.test(value)) {
    throw new InvalidRussianPhoneError();
  }

  const digits = value.replace(/\D/gu, "");
  let nationalNumber: string;

  if (digits.length === 10 && digits.startsWith("9")) {
    nationalNumber = digits;
  } else if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    nationalNumber = digits.slice(1);
  } else {
    throw new InvalidRussianPhoneError();
  }

  if (
    !nationalNumber.startsWith("9") ||
    /^(\d)\1{9}$/u.test(nationalNumber)
  ) {
    throw new InvalidRussianPhoneError();
  }

  return `+7${nationalNumber}`;
}
