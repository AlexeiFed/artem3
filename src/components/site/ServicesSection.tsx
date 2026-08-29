"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { useModal } from "@/components/forms/ModalProvider";
import type { LandingData } from "@/modules/content/content.types";
import {
  serviceAnchorHref,
  serviceAnchorId,
} from "@/modules/content/service-anchors";

import { ServiceIcon } from "./ServiceIcon";

function CtaArrow() {
  return (
    <svg
      className="service-cta-arrow"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M3 8h9M8.5 4.5 12.5 8l-4 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ServicesSection({
  services,
  intro,
}: {
  services: LandingData["services"];
  intro: LandingData["servicesIntro"];
}) {
  const [active, setActive] = useState<string>(
    services[0]?.slug ?? "razvod",
  );
  const { openModal } = useModal();
  const pickLockUntil = useRef(0);

  const syncActiveFromScroll = useEffectEvent((slug: string) => {
    if (performance.now() < pickLockUntil.current) return;
    setActive(slug);
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const domId = visible?.target.id;
        if (!domId) return;
        const match = services.find(
          (service) => serviceAnchorId(service.slug) === domId,
        );
        if (match) syncActiveFromScroll(match.slug);
      },
      { rootMargin: "-20% 0px -50%", threshold: [0.1, 0.25, 0.5] },
    );
    for (const service of services) {
      const element = document.getElementById(serviceAnchorId(service.slug));
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [services]);

  return (
    <section className="services section shell">
      <p className="eyebrow">{intro.eyebrow}</p>
      <h2>{intro.title}</h2>
      <nav className="service-tabs" aria-label="Разделы услуг">
        {services.map((service) => (
          <a
            key={service.slug}
            href={serviceAnchorHref(service.slug)}
            aria-current={active === service.slug ? "location" : undefined}
            onClick={() => {
              pickLockUntil.current = performance.now() + 900;
              setActive(service.slug);
            }}
          >
            {service.title}
          </a>
        ))}
      </nav>
      <div id="uslugi" className="service-list">
        {services.map((service, index) => (
          <article
            id={serviceAnchorId(service.slug)}
            key={service.slug}
            className="service-card"
          >
            <div className="service-main">
              <div className="service-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3>{service.title}</h3>
              <p className="lead">{service.description}</p>
              <p className="service-list-label">Краткий список ситуаций</p>
              <ul>
                {service.situations.map((situation) => (
                  <li key={situation}>{situation}</li>
                ))}
              </ul>
            </div>
            <aside>
              <ServiceIcon slug={service.slug} iconUrl={service.iconUrl} />
              <p className="service-trust">
                <strong>
                  <span className="service-trust-mark" aria-hidden="true">
                    !
                  </span>
                  Важно
                </strong>
                {service.trustNote}
              </p>
              <p className="price">
                От{" "}
                {new Intl.NumberFormat("ru-RU").format(
                  service.priceFromKopecks / 100,
                )}{" "}
                ₽
              </p>
              <button
                type="button"
                className="button service-cta"
                onClick={() => openModal(service.title)}
              >
                {service.ctaLabel}
                <CtaArrow />
              </button>
            </aside>
          </article>
        ))}
      </div>
    </section>
  );
}

