"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";

import { useModal } from "@/components/forms/ModalProvider";
import { useSmoothScroll } from "@/components/motion/LenisProvider";
import type { LandingData } from "@/modules/content/content.types";

export function Contacts({
  contacts,
  legal,
}: {
  contacts: LandingData["contacts"];
  legal: LandingData["legal"];
}) {
  const { openModal } = useModal();
  return (
    <>
      <section id="contacts" className="contacts section">
        <div className="shell contacts-grid">
          <div>
            <p className="eyebrow">{contacts.eyebrow}</p>
            <h2>Бесплатная консультация</h2>
            <p className="contacts-intro">{contacts.header}</p>
            <div className="contact-links">
              <a href={contacts.phone.href}>{contacts.phone.display}</a>
              <a href={contacts.telegram.url} target="_blank" rel="noreferrer">
                {contacts.telegram.label}
              </a>
              <a href={contacts.whatsapp.url} target="_blank" rel="noreferrer">
                {contacts.whatsapp.label}
              </a>
            </div>
            <address>{contacts.address}</address>
            <p>{contacts.workHours}</p>
            <button
              type="button"
              className="button button-light"
              onClick={() => openModal()}
            >
              Рассказать о ситуации
            </button>
          </div>
          <a
            className="map-panel"
            href={contacts.map.externalUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Открыть адрес на Яндекс Картах"
          >
            <span className="map-grid" aria-hidden="true" />
            <span className="map-pin" aria-hidden="true">
              АС
            </span>
            <strong>Хабаровск</strong>
            <small>Открыть на Яндекс Картах ↗</small>
          </a>
        </div>
      </section>
      <footer className="footer">
        <div className="shell footer-grid">
          <strong>Артём Сысуев</strong>
          <p>{legal.entityText}</p>
          <a href="/privacy">Политика конфиденциальности</a>
          <p>{legal.nonPublicOfferText}</p>
        </div>
      </footer>
    </>
  );
}

export function FloatingActions({ contacts }: { contacts: LandingData["contacts"] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const { scrollY } = useScroll();
  const { scrollTo } = useSmoothScroll();

  useMotionValueEvent(scrollY, "change", (value) => setShowTop(value > 400));

  return (
    <div className="floating-actions">
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="contact-menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <a href={contacts.phone.href}>Позвонить</a>
            <a href={contacts.telegram.url} target="_blank" rel="noreferrer">
              Telegram
            </a>
            <a href={contacts.whatsapp.url} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        type="button"
        className="contact-fab"
        aria-expanded={menuOpen}
        aria-label="Открыть способы связи"
        onClick={() => setMenuOpen((value) => !value)}
      >
        <span aria-hidden="true">↗</span>
      </button>
      <AnimatePresence>
        {showTop ? (
          <motion.button
            type="button"
            className="top-button"
            aria-label="Наверх"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollTo("#main")}
          >
            ↑
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
