"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
        {workflow.eyebrow ? (
          <p className="eyebrow">{workflow.eyebrow}</p>
        ) : null}
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
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".honesty-card"));
    if (cards.length === 0) return;
    const trackLeft = track.getBoundingClientRect().left;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    if (isDesktop) return;
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", syncActiveIndex, { passive: true });
    return () => track.removeEventListener("scroll", syncActiveIndex);
  }, [isDesktop, syncActiveIndex]);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(
      `.honesty-card:nth-child(${index + 1})`,
    );
    card?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "start",
      block: "nearest",
    });
    setActiveIndex(index);
  }

  const cards = data.items.map((item) => (
    <article key={item.title} className="honesty-card">
      <strong>{item.title}</strong>
      <p>{item.copy}</p>
    </article>
  ));

  return (
    <section className="honesty section">
      <div className="shell">
        {data.theme ? <p className="eyebrow">{data.theme}</p> : null}
        <h2>{data.title}</h2>
        {isDesktop ? (
          <div className="honesty-grid">{cards}</div>
        ) : (
          <>
            <motion.div
              ref={trackRef}
              className="honesty-track"
              initial={reduced ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {cards}
            </motion.div>
            <div className="honesty-dots" aria-label="Слайды">
              {data.items.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className="honesty-dot"
                  aria-label={`Показать: ${item.title}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                  onClick={() => scrollToIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

const DESKTOP_QUERY = "(min-width: 48rem)";
const subscribeDesktop = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }
  mediaQuery.addListener(onChange);
  return () => mediaQuery.removeListener(onChange);
};
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;
const getServerDesktopSnapshot = () => false;

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
              style={{
                top: `calc(var(--cases-sticky-top) + ${index} * var(--cases-sticky-step))`,
              }}
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
        <p className="reviews-disclaimer">
          Отзывы перепечатаны с публичных страниц 2ГИС и Яндекса. Формулировки
          авторов сохранены.
        </p>
        <div className="rating-row">
          {ratings.items.map((rating) => (
            <a
              key={rating.source}
              href={rating.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
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
                <a href={review.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {review.source} ↗
                </a>
              </footer>
            </article>
          ))}
        </div>
        <div className="certificates" aria-label="Документы об образовании">
          {certificates.map((certificate) => (
            <article key={certificate.title}>
              <div className="certificate-copy">
                <small>Документ</small>
                <strong>{certificate.title}</strong>
              </div>
              <a
                className="certificate-scan"
                href={certificate.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={certificate.imageUrl}
                  alt={certificate.altText}
                  width={1200}
                  height={800}
                  sizes="(max-width: 900px) 100vw, 36rem"
                />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
