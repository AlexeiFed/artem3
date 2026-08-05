"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { motion } from "motion/react";

import { useModal } from "@/components/forms/ModalProvider";
import type { LandingData } from "@/modules/content/content.types";
import {
  serviceAnchorHref,
  serviceAnchorId,
} from "@/modules/content/service-anchors";

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
            <div className="service-number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="service-main">
              <h3>{service.title}</h3>
              <p className="lead">{service.description}</p>
              <ul>
                {service.situations.map((situation) => (
                  <li key={situation}>{situation}</li>
                ))}
              </ul>
            </div>
            <aside>
              <JusticeScales />
              <p>
                <strong>Важно</strong>
                {service.trustNote}
              </p>
              <p className="price">
                от{" "}
                {new Intl.NumberFormat("ru-RU").format(
                  service.priceFromKopecks / 100,
                )}{" "}
                ₽
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() => openModal(service.title)}
              >
                {service.ctaLabel} ↗
              </button>
            </aside>
          </article>
        ))}
      </div>
    </section>
  );
}

function JusticeScales() {
  return (
    <motion.svg
      className="justice-scales"
      viewBox="0 0 160 110"
      role="img"
      aria-label="Весы правосудия"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
    >
      <motion.g
        className="scale-beam"
        variants={{
          hidden: { rotate: -7, transformOrigin: "80px 30px" },
          shown: { rotate: 0, transformOrigin: "80px 30px" },
        }}
      >
        <path d="M24 34H136M80 21V96" />
        <g className="scale-pan scale-pan-left">
          <path d="M42 34L24 74H60L42 34Z" />
        </g>
        <g className="scale-pan scale-pan-right">
          <path d="M118 34L100 74H136L118 34Z" />
        </g>
      </motion.g>
      <path d="M55 97H105M67 88H93" />
    </motion.svg>
  );
}
