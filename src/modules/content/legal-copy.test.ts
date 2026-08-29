import { describe, expect, it } from "vitest";

import { PERSONAL_DATA_CONSENT_CHECKBOX_TEXT } from "@/modules/leads/personal-data-consent";

import {
  COOKIE_POLICY_TITLE,
  DEFAULT_COOKIES_TEXT,
  DEFAULT_PERSONAL_DATA_TEXT,
  DEFAULT_PRIVACY_TEXT,
  DEFAULT_TERMS_TEXT,
  OPERATOR_EMAIL,
  PERSONAL_DATA_PROCESSING_POLICY_TITLE,
} from "./legal-copy";
import { PRODUCTION_SITE_URL } from "./production-site";

const FORBIDDEN_DOMAIN = /vibespace27/iu;
const PRIVACY_POLICY_PHRASE = /политик[аие] конфиденциальности/iu;

describe("legal-copy 152-FZ", () => {
  it("uses the operator email and the production site origin", () => {
    expect(OPERATOR_EMAIL).toBe("artem-sysuev@yandex.ru");
    expect(DEFAULT_PRIVACY_TEXT).toContain(OPERATOR_EMAIL);
    expect(DEFAULT_PERSONAL_DATA_TEXT).toContain(OPERATOR_EMAIL);
    expect(DEFAULT_COOKIES_TEXT).toContain(OPERATOR_EMAIL);
    expect(DEFAULT_PRIVACY_TEXT).toContain(PRODUCTION_SITE_URL);
    expect(DEFAULT_COOKIES_TEXT).toContain(PRODUCTION_SITE_URL);
    expect(DEFAULT_PERSONAL_DATA_TEXT).toContain(PRODUCTION_SITE_URL);
    expect(DEFAULT_PRIVACY_TEXT).not.toMatch(FORBIDDEN_DOMAIN);
    expect(DEFAULT_COOKIES_TEXT).not.toMatch(FORBIDDEN_DOMAIN);
    expect(DEFAULT_PERSONAL_DATA_TEXT).not.toMatch(FORBIDDEN_DOMAIN);
    expect(DEFAULT_TERMS_TEXT).not.toMatch(FORBIDDEN_DOMAIN);
  });

  it("does not use «политика конфиденциальности»", () => {
    expect(PERSONAL_DATA_PROCESSING_POLICY_TITLE).toBe(
      "Политика в отношении обработки персональных данных",
    );
    expect(DEFAULT_PRIVACY_TEXT).toContain(PERSONAL_DATA_PROCESSING_POLICY_TITLE);
    expect(DEFAULT_PRIVACY_TEXT).toMatch(/ст\. 18\.1/);
    expect(DEFAULT_PRIVACY_TEXT).not.toMatch(PRIVACY_POLICY_PHRASE);
    expect(DEFAULT_COOKIES_TEXT).not.toMatch(PRIVACY_POLICY_PHRASE);
    expect(PERSONAL_DATA_CONSENT_CHECKBOX_TEXT).not.toMatch(PRIVACY_POLICY_PHRASE);
  });

  it("covers 152-FZ policy sections, structured consent and cookie policy", () => {
    expect(COOKIE_POLICY_TITLE).toBe("Политика cookie");
    expect(DEFAULT_COOKIES_TEXT).toMatch(/Политика использования cookie/u);
    expect(DEFAULT_COOKIES_TEXT).not.toMatch(/^Нажимая «ОК»/u);

    for (const heading of [
      "1. Общие положения",
      "2. Основные понятия, используемые в Политике",
      "3. Основные права и обязанности Оператора",
      "4. Основные права и обязанности субъектов персональных данных",
      "5. Принципы обработки персональных данных",
      "6. Цели обработки персональных данных",
      "7. Условия обработки персональных данных",
      "8. Порядок сбора, хранения, передачи и других видов обработки персональных данных",
      "9. Перечень действий, производимых Оператором с полученными персональными данными",
      "10. Трансграничная передача персональных данных",
      "11. Конфиденциальность персональных данных",
      "12. Заключительные положения",
    ]) {
      expect(DEFAULT_PRIVACY_TEXT).toContain(heading);
    }

    expect(DEFAULT_PRIVACY_TEXT).toMatch(/Telegram/u);
    expect(DEFAULT_PRIVACY_TEXT).toMatch(/трансграничн/iu);
    expect(DEFAULT_PRIVACY_TEXT).toMatch(/Timeweb/u);
    expect(DEFAULT_PRIVACY_TEXT).toMatch(/ООО «Яндекс»/u);

    for (const heading of [
      "1. Оператор персональных данных",
      "2. Цели и состав обрабатываемых данных",
      "3. Передача данных третьим лицам",
      "4. Сроки хранения",
      "5. Отзыв согласия",
      "6. Редакция документа",
    ]) {
      expect(DEFAULT_PERSONAL_DATA_TEXT).toContain(heading);
    }

    expect(DEFAULT_TERMS_TEXT).toMatch(
      /Политикой в отношении обработки персональных данных/u,
    );
    expect(DEFAULT_PRIVACY_TEXT.length).toBeLessThanOrEqual(20_000);
    expect(DEFAULT_COOKIES_TEXT.length).toBeLessThanOrEqual(20_000);
    expect(DEFAULT_PERSONAL_DATA_TEXT.length).toBeLessThanOrEqual(20_000);
  });
});
