import type { Metadata } from "next";
import Link from "next/link";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
};

export default function PrivacyPage() {
  const { legal } = getPreviewLandingData();
  return (
    <main className="legal-page shell">
      <Link href="/" className="back-link">
        ← На главную
      </Link>
      <p className="eyebrow">Правовая информация</p>
      <h1>Политика обработки персональных данных</h1>
      <section>
        <h2>Общие положения</h2>
        <p>{legal.privacyText}</p>
        <p>{legal.entityText}</p>
      </section>
      <section>
        <h2>Согласие пользователя</h2>
        <p>{legal.personalDataText}</p>
        <p>
          Данные из формы используются только для ответа на обращение и не
          публикуются. Пользователь вправе отозвать согласие, обратившись по
          контактам, указанным на сайте.
        </p>
      </section>
      <p>{legal.nonPublicOfferText}</p>
    </main>
  );
}
