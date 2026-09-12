"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";

import { useOptionalModal } from "@/components/forms/ModalProvider";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { designTokens } from "@/lib/design-tokens";
import {
  HERO_CHROME_GUTTER_VAR,
  heroChromeGutter,
} from "@/lib/hero-visual-height";
import {
  sanitizeHeroMarkup,
  stripHeroMarkup,
  disclaimerToHtml,
} from "@/lib/hero-markup";
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
  const markup = sanitizeHeroMarkup(title);
  const byNewline = markup
    .split(/\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (byNewline.length > 1) {
    return byNewline.map((text) => ({
      text,
      place: /хабаровске/iu.test(stripHeroMarkup(text)),
      wrap: false,
    }));
  }

  const collapsed = stripHeroMarkup(markup);
  if (collapsed === DEFAULT_TITLE_JOINED) {
    return DEFAULT_TITLE_LINES.map((line) => ({
      text: line.text,
      place: line.place,
      wrap: false,
    }));
  }

  return [{ text: markup, place: false, wrap: true }];
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
  const [videoArmed, setVideoArmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = hydrated && reduced;
  const renderVideo = hydrated && !shouldReduceMotion;
  const showVideo = renderVideo && videoArmed;
  const offerBullets = data.offerBullets.filter(Boolean);

  useEffect(() => {
    if (!renderVideo) return;

    // Не requestIdleCallback: Lenis крутит rAF, idle может не наступить.
    const timer = window.setTimeout(() => setVideoArmed(true), 0);
    return () => window.clearTimeout(timer);
  }, [renderVideo]);

  useEffect(() => {
    if (!showVideo) return;
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
  }, [showVideo]);

  useEffect(() => {
    const hero = document.getElementById("main");
    if (!hero) return;

    const applyGutter = () => {
      hero.style.setProperty(
        HERO_CHROME_GUTTER_VAR,
        heroChromeGutter({
          userAgent: navigator.userAgent,
          visualHeight: window.visualViewport?.height ?? window.innerHeight,
          layoutHeight: window.innerHeight,
        }),
      );
    };

    applyGutter();
    window.visualViewport?.addEventListener("resize", applyGutter);
    window.addEventListener("resize", applyGutter);
    return () => {
      window.visualViewport?.removeEventListener("resize", applyGutter);
      window.removeEventListener("resize", applyGutter);
    };
  }, []);

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

        {showVideo ? (
          <video
            ref={videoRef}
            data-testid="hero-video"
            data-video-failed={videoFailed ? "true" : "false"}
            className={
              videoFailed ? "is-failed" : videoPlaying ? "is-playing" : undefined
            }
            src={data.video.fallbackUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
            {...{ "webkit-playsinline": "" }}
            onError={() => setVideoFailed(true)}
          />
        ) : null}

        <motion.div
          className="hero-case-cover"
          aria-hidden="true"
          initial={
            shouldReduceMotion ? false : { clipPath: "inset(0 0 0 0)" }
          }
          animate={{ clipPath: "inset(0 100% 0 0)" }}
          transition={{ duration: durationSlow, ease: easeCinematic }}
        />
      </div>

      <div className="hero-overlay" aria-hidden="true" />

      <div className="hero-content shell">
        <div className="hero-copy">
          <motion.p
            className="eyebrow hero-eyebrow"
            aria-hidden={data.eyebrow ? undefined : true}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durationFast }}
            dangerouslySetInnerHTML={{
              __html: data.eyebrow
                ? sanitizeHeroMarkup(data.eyebrow)
                : "&nbsp;",
            }}
          />

          <h1 aria-label={stripHeroMarkup(data.title)}>
            {titleLines(data.title).map((line, index, lines) => (
              <span
                aria-hidden="true"
                className={`hero-title-line${line.place ? " hero-title-place" : ""}${line.wrap ? " hero-title-line-wrap" : ""}`}
                key={`${index}-${line.text}`}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHeroMarkup(
                    index < lines.length - 1 ? `${line.text} ` : line.text,
                  ),
                }}
              />
            ))}
          </h1>

          {data.subtitle ? (
            <motion.p
              className="hero-subtitle"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: subtitleDelay, duration: durationBase }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHeroMarkup(data.subtitle),
              }}
            />
          ) : null}

          {offerBullets.length > 0 ? (
            <motion.ul
              className="hero-offer"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: subtitleDelay, duration: durationBase }}
            >
              {offerBullets.map((bullet) => (
                <li key={bullet}>
                  <span className="hero-offer-check" aria-hidden="true">
                    ✓
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHeroMarkup(bullet),
                    }}
                  />
                </li>
              ))}
            </motion.ul>
          ) : null}

          <motion.div
            className="hero-actions"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: durationBase, duration: durationBase }}
          >
            <MagneticButton
              type="button"
              className="button button-brass-glow"
              onClick={() => modal?.openModal("Главный экран")}
            >
              {data.cta.label}
            </MagneticButton>
          </motion.div>

          <p
            className="hero-disclaimer"
            dangerouslySetInnerHTML={{
              __html: disclaimerToHtml(data.disclaimer),
            }}
          />
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
                  <strong dangerouslySetInnerHTML={{ __html: sanitizeHeroMarkup(metric.value) }} />
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHeroMarkup(metric.label) }} />
                </motion.div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
