"use client";

import { motion, useReducedMotion } from "motion/react";

import { useOptionalModal } from "@/components/forms/ModalProvider";
import { MagneticButton } from "@/components/motion/MagneticButton";
import type { LandingData } from "@/modules/content/content.types";

export function Hero({ data }: { data: LandingData["hero"] }) {
  const modal = useOptionalModal();
  const reduced = useReducedMotion();

  return (
    <section id="main" className="hero">
      <div className="hero-stage" aria-hidden={data.video.vkEmbed ? undefined : true}>
        {data.video.vkEmbed ? (
          <iframe
            src={data.video.vkEmbed.url}
            title={data.video.vkEmbed.title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            loading="eager"
          />
        ) : (
          <div className="hero-abstract">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      <div className="hero-overlay" />
      <div className="hero-content shell">
        <motion.p
          className="eyebrow hero-eyebrow"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {data.eyebrow}
        </motion.p>
        <h1 aria-label={data.title}>
          {data.title.split(" ").map((word, index) => (
            <motion.span
              aria-hidden="true"
              key={`${word}-${index}`}
              initial={reduced ? false : { opacity: 0, y: "70%" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.045 }}
            >
              {word}{" "}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="hero-subtitle"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {data.subtitle}
        </motion.p>
        <ul className="hero-badges" aria-label="Преимущества">
          {data.badges.map((badge) => (
            <li key={badge.label}>{badge.label}</li>
          ))}
        </ul>
        <div className="hero-actions">
          <MagneticButton
            type="button"
            className="button button-light"
            onClick={() => modal?.openModal()}
          >
            {data.cta.label}
          </MagneticButton>
          <button
            type="button"
            className="mute-control"
            disabled={!data.video.vkEmbed}
            title={
              data.video.vkEmbed
                ? "Управление звуком доступно внутри VK-плеера"
                : "Звук появится после подключения видео VK"
            }
          >
            {data.video.vkEmbed ? "Звук — в плеере VK" : "Без звука · видео не подключено"}
          </button>
        </div>
        <p className="hero-disclaimer">{data.disclaimer}</p>
      </div>
    </section>
  );
}
