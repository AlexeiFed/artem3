"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";

import { useOptionalModal } from "@/components/forms/ModalProvider";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { designTokens } from "@/lib/design-tokens";
import type { LandingData } from "@/modules/content/content.types";

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }

  mediaQuery.addListener(onChange);
  return () => mediaQuery.removeListener(onChange);
};
const getReducedMotionSnapshot = () =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotionSnapshot = () => false;
const { durationBase, durationFast, durationSlow, easeCinematic } =
  designTokens.motion;
const titleDelay = (durationFast * 2) / 3;
const titleStagger = durationFast / 3;
const subtitleDelay = durationFast + titleDelay;
const dossierDelay = durationBase + durationFast / 2;
const metricsDelay = dossierDelay + durationFast;

const DEFAULT_TITLE_LINES = [
  { text: "Развод, алименты", place: false },
  { text: "и раздел имущества", place: false },
  { text: "в Хабаровске", place: true },
] as const;

const DEFAULT_TITLE_JOINED = DEFAULT_TITLE_LINES.map((line) => line.text).join(
  " ",
);

function titleLines(
  title: string,
): Array<{ text: string; place: boolean; wrap: boolean }> {
  const byNewline = title
    .split(/\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (byNewline.length > 1) {
    return byNewline.map((text) => ({
      text,
      place: /хабаровске/iu.test(text),
      wrap: false,
    }));
  }

  const collapsed = title.replace(/\s+/gu, " ").trim();
  if (collapsed === DEFAULT_TITLE_JOINED) {
    return DEFAULT_TITLE_LINES.map((line) => ({
      text: line.text,
      place: line.place,
      wrap: false,
    }));
  }

  return [{ text: collapsed, place: false, wrap: true }];
}

export function Hero({ data }: { data: LandingData["hero"] }) {
  const modal = useOptionalModal();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = hydrated && reduced;
  const renderVideo = hydrated && !shouldReduceMotion;

  useEffect(() => {
    if (!renderVideo) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");

    const attemptPlay = () => {
      void Promise.resolve(video.play())
        .then(() => {
          if (!video.paused) setVideoPlaying(true);
        })
        .catch(() => undefined);
    };

    attemptPlay();
    video.addEventListener("canplay", attemptPlay);
    video.addEventListener("playing", attemptPlay);
    return () => {
      video.removeEventListener("canplay", attemptPlay);
      video.removeEventListener("playing", attemptPlay);
    };
  }, [renderVideo]);

  return (
    <section id="main" className="hero">
      <div
        className="hero-stage"
        data-testid="hero-stage"
        data-reduced-motion={shouldReduceMotion ? "true" : "false"}
        aria-hidden="true"
      >
        <div className="hero-abstract" data-testid="hero-abstract">
          <span />
          <span />
          <span />
        </div>

        {posterFailed ? null : (
          <Image
            data-testid="hero-poster"
            className="hero-poster"
            src={data.video.posterUrl}
            alt=""
            fill
            preload
            sizes="100vw"
            onError={() => setPosterFailed(true)}
          />
        )}

        {renderVideo ? (
          <video
            ref={videoRef}
            data-testid="hero-video"
            data-video-failed={videoFailed ? "true" : "false"}
            className={
              videoFailed ? "is-failed" : videoPlaying ? "is-playing" : undefined
            }
            src={data.video.fallbackUrl}
            poster={data.video.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            {...{ "webkit-playsinline": "" }}
            onError={() => setVideoFailed(true)}
          />
        ) : null}
      </div>

      <div className="hero-overlay" aria-hidden="true" />
      <motion.div
        className="hero-case-cover"
        aria-hidden="true"
        initial={
          shouldReduceMotion ? false : { clipPath: "inset(0 0 0 0)" }
        }
        animate={{ clipPath: "inset(0 100% 0 0)" }}
        transition={{ duration: durationSlow, ease: easeCinematic }}
      />

      <div className="hero-content shell">
        <div className="hero-copy">
          <motion.p
            className="eyebrow hero-eyebrow"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durationFast }}
          >
            {data.eyebrow}
          </motion.p>

          <h1 aria-label={data.title.replace(/\s+/gu, " ").trim()}>
            {titleLines(data.title).map((line, index) => (
              <motion.span
                aria-hidden="true"
                className={`hero-title-line${line.place ? " hero-title-place" : ""}${line.wrap ? " hero-title-line-wrap" : ""}`}
                key={`${index}-${line.text}`}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: "55%" }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: titleDelay + index * titleStagger,
                  duration: durationBase,
                }}
              >
                {line.text}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="hero-subtitle"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: subtitleDelay, duration: durationBase }}
          >
            {data.subtitle}
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: durationBase, duration: durationBase }}
          >
            <MagneticButton
              type="button"
              className="button"
              onClick={() => modal?.openModal("Главный экран")}
            >
              {data.cta.label}
            </MagneticButton>
          </motion.div>

          <p className="hero-disclaimer">{data.disclaimer}</p>
        </div>

        <motion.span
          className="hero-dossier-rule"
          aria-hidden="true"
          initial={shouldReduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: durationBase, duration: durationFast }}
        />

        <aside className="hero-dossier" aria-label="Практика в цифрах">
          <span className="hero-dossier-tab">Практика в цифрах</span>
          <ol aria-label="Практика в цифрах">
            {data.metrics.map((metric, index) => (
              <li key={metric.label}>
                <motion.div
                  className="hero-metric-content"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: metricsDelay + index * (durationFast / 2),
                    duration: durationFast,
                  }}
                >
                  <span className="hero-metric-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </motion.div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
