"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";

import { useModal } from "@/components/forms/ModalProvider";
import { useSmoothScroll } from "@/components/motion/LenisProvider";
import type { LandingData } from "@/modules/content/content.types";

import { ContactsMap } from "./ContactsMap";

export function Contacts({
  contacts,
  legal,
  yandexMapsApiKey,
}: {
  contacts: LandingData["contacts"];
  legal: LandingData["legal"];
  yandexMapsApiKey: string | undefined;
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
              <a href={contacts.phone.href}>
                <PhoneIcon className="contact-link-icon" />
                {contacts.phone.display}
              </a>
              <a href={contacts.telegram.url} target="_blank" rel="noreferrer">
                {contacts.telegram.label}
              </a>
              <a href={contacts.whatsapp.url} target="_blank" rel="noreferrer">
                {contacts.whatsapp.label}
              </a>
              <a href={contacts.max.url} target="_blank" rel="noreferrer">
                {contacts.max.label}
              </a>
            </div>
            <address>{contacts.address}</address>
            <p className="contacts-hours">{contacts.workHours}</p>
            <button
              type="button"
              className="button button-light contacts-cta"
              onClick={() => openModal("Контакты")}
            >
              Рассказать о ситуации
            </button>
          </div>
          <ContactsMap
            latitude={contacts.map.latitude}
            longitude={contacts.map.longitude}
            externalUrl={contacts.map.externalUrl}
            apiKey={yandexMapsApiKey}
          />
        </div>
      </section>
      <footer className="footer">
        <div className="shell footer-grid">
          <strong>Артём Сысуев</strong>
          <p>{legal.entityText}</p>
          <nav className="footer-legal" aria-label="Правовая информация">
            <a href="/privacy">Политика конфиденциальности</a>
            <a href="/cookies">Согласие на обработку файлов cookies</a>
            <a href="/personal-data">
              Согласие на обработку персональных данных
            </a>
          </nav>
          <a
            href="https://vk.com/tvoe_pravo_tut"
            target="_blank"
            rel="noreferrer"
          >
            ВКонтакте
          </a>
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
            <a href={contacts.max.url} target="_blank" rel="noreferrer">
              MAX
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
        <PhoneIcon className="fab-phone-icon" testId="phone-fab-icon" />
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

function PhoneIcon({
  className,
  testId,
}: {
  className?: string;
  testId?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      {...(testId === undefined ? {} : { "data-testid": testId })}
    >
      <path
        fill="currentColor"
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1l-2.2 2.9z"
      />
    </svg>
  );
}
