"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { designTokens } from "@/lib/design-tokens";

export const COOKIE_CONSENT_KEY = "artem-cookie-consent";

const SHOW_DELAY_MS = 650;

function subscribeConsent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerConsentSnapshot() {
  return true;
}

export function CookieBanner() {
  const reduced = useReducedMotion();
  const hasConsent = useSyncExternalStore(
    subscribeConsent,
    readConsent,
    getServerConsentSnapshot,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasConsent) return;
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hasConsent]);

  function accept() {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {!hasConsent && visible ? (
        <motion.aside
          className="cookie-banner"
          role="dialog"
          aria-label="Использование cookie"
          initial={reduced ? false : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={{
            duration: designTokens.motion.durationBase,
            ease: designTokens.motion.easeCinematic,
          }}
        >
          <p className="cookie-banner-text">
            Мы используем файлы cookie. Это помогает нам анализировать
            взаимодействие посетителей с сайтом и делать его лучше. Продолжая
            пользоваться сайтом, вы соглашаетесь с{" "}
            <a href="/cookies">использованием cookie</a>.
          </p>
          <button type="button" className="cookie-banner-ok" onClick={accept}>
            ОК
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
