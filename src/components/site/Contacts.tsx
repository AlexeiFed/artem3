"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
            <h2>{contacts.header}</h2>
            <div className="contacts-channels">
              <div className="contact-links">
                <a href={contacts.phone.href}>
                  <PhoneIcon className="contact-link-icon" />
                  {contacts.phone.display}
                </a>
                <a href={contacts.max.url} target="_blank" rel="noreferrer">
                  {contacts.max.label}
                </a>
                <a href={contacts.telegram.url} target="_blank" rel="noreferrer">
                  {contacts.telegram.label}
                </a>
                <a href={`mailto:${contacts.email.address}`}>
                  {contacts.email.label}: {contacts.email.address}
                </a>
                <a href={contacts.whatsapp.url} target="_blank" rel="noreferrer">
                  {contacts.whatsapp.label}
                </a>
              </div>
              <p className="contacts-sla">{contacts.responseSla}</p>
            </div>
            <div className="contacts-location">
              <address>{contacts.address}</address>
              <p className="contacts-hours">{contacts.workHours}</p>
              {contacts.hoursNote ? (
                <p className="contacts-hours-note">{contacts.hoursNote}</p>
              ) : null}
            </div>
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
            address={contacts.address}
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

type ContactChannel = {
  key: string;
  href: string;
  label: string;
  external?: boolean;
  icon: ReactNode;
};

export function FloatingActions({ contacts }: { contacts: LandingData["contacts"] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { scrollTo } = useSmoothScroll();

  const channels: ContactChannel[] = [
    {
      key: "phone",
      href: contacts.phone.href,
      label: `Позвонить: ${contacts.phone.display}`,
      icon: <PhoneIcon />,
    },
    {
      key: "max",
      href: contacts.max.url,
      label: contacts.max.label,
      external: true,
      icon: <MaxIcon />,
    },
    {
      key: "telegram",
      href: contacts.telegram.url,
      label: contacts.telegram.label,
      external: true,
      icon: <TelegramIcon />,
    },
    {
      key: "email",
      href: `mailto:${contacts.email.address}`,
      label: `Email: ${contacts.email.address}`,
      icon: <EmailIcon />,
    },
    {
      key: "whatsapp",
      href: contacts.whatsapp.url,
      label: contacts.whatsapp.label,
      external: true,
      icon: <WhatsAppIcon />,
    },
  ];

  useMotionValueEvent(scrollY, "change", (value) => {
    setShowTop(value > 400);
    if (menuOpen) setMenuOpen(false);
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="contact-rail" aria-label="Быстрая связь">
        {channels.map((channel) => (
          <a
            key={channel.key}
            href={channel.href}
            className="contact-rail-link"
            aria-label={channel.label}
            {...(channel.external
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
          >
            {channel.icon}
          </a>
        ))}
      </nav>

      <div className="floating-actions" ref={rootRef}>
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              className="contact-menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {channels.map((channel) => (
                <a
                  key={channel.key}
                  href={channel.href}
                  className="contact-menu-icon"
                  aria-label={channel.label}
                  onClick={() => setMenuOpen(false)}
                  {...(channel.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {channel.icon}
                </a>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          className={`contact-fab${menuOpen ? " is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-label={
            menuOpen ? "Закрыть способы связи" : "Открыть способы связи"
          }
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? (
            <CloseIcon className="fab-close-icon" />
          ) : (
            <PhoneIcon className="fab-phone-icon" testId="phone-fab-icon" />
          )}
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
    </>
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M6.4 6.4 12 12l5.6-5.6 1.4 1.4L13.4 13.4l5.6 5.6-1.4 1.4L12 14.8l-5.6 5.6-1.4-1.4 5.6-5.6-5.6-5.6z"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 512 512" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M470.4354553,45.4225006L16.8273029,221.2490387c-18.253809,8.1874695-24.4278889,24.5854034-4.4127407,33.4840851l116.3710175,37.1726685l281.3674316-174.789505c15.3625488-10.9733887,31.0910339-8.0470886,17.5573425,4.023468L186.0532227,341.074646l-7.5913849,93.0762329c7.0313721,14.3716125,19.9055786,14.4378967,28.1172485,7.2952881l66.8582916-63.5891418l114.5050659,86.1867065c26.5942688,15.8265076,41.0652466,5.6130371,46.7870789-23.3935242L509.835083,83.1804428C517.6329956,47.474514,504.3345032,31.7425518,470.4354553,45.4225006z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 50 50" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M25,2C12.318,2,2,12.318,2,25c0,3.96,1.023,7.854,2.963,11.29L2.037,46.73c-0.096,0.343-0.003,0.711,0.245,0.966 C2.473,47.893,2.733,48,3,48c0.08,0,0.161-0.01,0.24-0.029l10.896-2.699C17.463,47.058,21.21,48,25,48c12.682,0,23-10.318,23-23 S37.682,2,25,2z M36.57,33.116c-0.492,1.362-2.852,2.605-3.986,2.772c-1.018,0.149-2.306,0.213-3.72-0.231 c-0.857-0.27-1.957-0.628-3.366-1.229c-5.923-2.526-9.791-8.415-10.087-8.804C15.116,25.235,13,22.463,13,19.594 s1.525-4.28,2.067-4.864c0.542-0.584,1.181-0.73,1.575-0.73s0.787,0.005,1.132,0.021c0.363,0.018,0.85-0.137,1.329,1.001 c0.492,1.168,1.673,4.037,1.819,4.33c0.148,0.292,0.246,0.633,0.05,1.022c-0.196,0.389-0.294,0.632-0.59,0.973 s-0.62,0.76-0.886,1.022c-0.296,0.291-0.603,0.606-0.259,1.19c0.344,0.584,1.529,2.493,3.285,4.039 c2.255,1.986,4.158,2.602,4.748,2.894c0.59,0.292,0.935,0.243,1.279-0.146c0.344-0.39,1.476-1.703,1.869-2.286 s0.787-0.487,1.329-0.292c0.542,0.194,3.445,1.604,4.035,1.896c0.59,0.292,0.984,0.438,1.132,0.681 C37.062,30.587,37.062,31.755,36.57,33.116z"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2 8 5 8-5H4Zm16 10V9l-8 5-8-5v8h16Z"
      />
    </svg>
  );
}

function MaxIcon() {
  return (
    <svg viewBox="0 0 720 720" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"
      />
    </svg>
  );
}
