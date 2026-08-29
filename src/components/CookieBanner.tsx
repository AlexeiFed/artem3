"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  COOKIE_CONSENT_KEY,
  acceptCookieConsent,
  readCookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";
import { designTokens } from "@/lib/design-tokens";
import { COOKIE_POLICY_TITLE_PREPOSITIONAL } from "@/modules/content/legal-copy";

export { COOKIE_CONSENT_KEY };

const SHOW_DELAY_MS = 650;

function getServerConsentSnapshot() {
  return true;
}

export function CookieBanner() {
  const reduced = useReducedMotion();
  const hasConsent = useSyncExternalStore(
    subscribeCookieConsent,
    readCookieConsent,
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
    acceptCookieConsent();
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {!hasConsent && visible ? (
        <motion.aside
          className="cookie-banner"
          role="region"
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
            Сайт использует файлы cookie, Яндекс.Карты и при подключении —
            Яндекс.Метрику, чтобы карта и аналитика работали. Нажимая «ОК», вы
            даёте ИП Сысуеву А.А. согласие на это. Подробности — в{" "}
            <a href="/cookies">{COOKIE_POLICY_TITLE_PREPOSITIONAL}</a>. Если не
            согласны —
            отключите cookie в браузере или покиньте сайт.
          </p>
          <button type="button" className="cookie-banner-ok" onClick={accept}>
            ОК
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
