"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { useModal } from "@/components/forms/ModalProvider";
import type { LandingData } from "@/modules/content/content.types";

export function ServicesSection({
  services,
}: {
  services: LandingData["services"];
}) {
  const [active, setActive] = useState<string>(
    services[0]?.slug ?? "razvod",
  );
  const { openModal } = useModal();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55%", threshold: [0.15, 0.5] },
    );
    for (const service of services) {
      const element = document.getElementById(service.slug);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [services]);

  return (
    <section id="uslugi" className="services section shell">
      <p className="eyebrow">Практика</p>
      <h2>Юридическая помощь без туманных формулировок</h2>
      <nav className="service-tabs" aria-label="Разделы услуг">
        {services.map((service) => (
          <a
            key={service.slug}
            href={`#${service.slug}`}
            aria-current={active === service.slug ? "location" : undefined}
          >
            {service.title}
          </a>
        ))}
      </nav>
      <div className="service-list">
        {services.map((service, index) => (
          <article
            id={service.slug}
            key={service.slug}
            tabIndex={service.isHighValue ? 0 : undefined}
            className={`service-card${service.isHighValue ? " high-value" : ""}`}
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
                Обсудить эту услугу ↗
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
        <path d="M42 34L24 74H60L42 34ZM118 34L100 74H136L118 34Z" />
      </motion.g>
      <path d="M55 97H105M67 88H93" />
    </motion.svg>
  );
}
