"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import type { LandingData } from "@/modules/content/content.types";

export function Workflow({
  consultation,
  workflow,
}: {
  consultation: LandingData["consultation"];
  workflow: LandingData["workflow"];
}) {
  return (
    <section className="workflow section shell">
      <div>
        <p className="eyebrow">{consultation.eyebrow}</p>
        <h2>{consultation.title}</h2>
        <ol className="benefits">
          {consultation.benefits.map((benefit, index) => (
            <li key={benefit}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {benefit}
            </li>
          ))}
        </ol>
      </div>
      <div className="workflow-column">
        <p className="eyebrow">{workflow.eyebrow}</p>
        <h3>{workflow.title}</h3>
        {workflow.bullets.map((bullet) => (
          <article key={bullet.title}>
            <strong>{bullet.title}</strong>
            <p>{bullet.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HonestyBanner({
  data,
}: {
  data: LandingData["honesty"];
}) {
  return (
    <section className="honesty section">
      <div className="shell">
        <p className="eyebrow">{data.theme}</p>
        <h2>{data.title}</h2>
        <p>{data.copy}</p>
      </div>
    </section>
  );
}

export function CasesStack({ cases }: { cases: LandingData["cases"] }) {
  const reduced = useReducedMotion();
  return (
    <section id="cases" className="cases section shell">
      <p className="eyebrow">Практика</p>
      <h2>Дела, где важны детали</h2>
      <div className="cases-layout">
        <figure className="cases-portrait">
          <Image
            src="/media/artem-desk-cases.jpg"
            alt="Артём Сысуев за рабочим столом с материалами дела"
            width={260}
            height={347}
            className="site-portrait-image cases-portrait-image"
          />
          <figcaption>Разбор материалов дела</figcaption>
        </figure>
        <div className="case-stack">
          {cases.map((item, index) => (
            <motion.article
              key={item.situation}
              className="case-card"
              data-testid="case-card"
              style={{ top: `${5 + index * 1.1}rem` }}
              initial={reduced ? false : { scale: 0.97, opacity: 0.7 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ amount: 0.4 }}
            >
              <span className="case-index">
                Кейс {String(index + 1).padStart(2, "0")}
              </span>
              <div className="case-copy">
                <CasePart label="Ситуация" text={item.situation} />
                <CasePart label="Действия" text={item.action} />
                <CasePart label="Результат" text={item.result} result />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CasePart({
  label,
  text,
  result = false,
}: {
  label: string;
  text: string;
  result?: boolean;
}) {
  return (
    <div className={result ? "case-result" : undefined}>
      <small>{label}</small>
      <p>{text}</p>
    </div>
  );
}

export function Reviews({
  ratings,
  reviews,
  certificates,
}: {
  ratings: LandingData["ratings"];
  reviews: LandingData["reviews"];
  certificates: LandingData["certificates"];
}) {
  return (
    <section id="reviews" className="reviews section">
      <div className="shell">
        <p className="eyebrow">Доверие</p>
        <h2>{ratings.heading}</h2>
        <div className="rating-row">
          {ratings.items.map((rating) => (
            <a
              key={rating.source}
              href={rating.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="rating-badge"
            >
              <strong>{rating.value.toFixed(1)}</strong>
              <span>
                {rating.source} · {rating.reviewCount} отзывов
              </span>
            </a>
          ))}
        </div>
        <div className="review-carousel">
          {reviews.map((review) => (
            <article key={review.author}>
              <p>«{review.quote}»</p>
              <footer>
                <strong>{review.author}</strong>
                <a href={review.sourceUrl} target="_blank" rel="noreferrer">
                  {review.source} ↗
                </a>
              </footer>
            </article>
          ))}
        </div>
        <div className="certificates" aria-label="Сертификаты">
          {certificates.map((certificate, index) => (
            <article key={certificate.title} aria-label={certificate.altText}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{certificate.title}</strong>
              <small>Документ будет добавлен после верификации</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
