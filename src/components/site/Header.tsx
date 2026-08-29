"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useModal } from "@/components/forms/ModalProvider";
import { designTokens } from "@/lib/design-tokens";
import type { LandingData } from "@/modules/content/content.types";

import { PhoneIcon } from "./PhoneIcon";

type ServiceLink = {
  slug: string;
  label: string;
  href: string;
};

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2.2 4.2 6 8l3.8-3.8 1.1 1.1L6 10.2 1.1 5.3z"
      />
    </svg>
  );
}

export function Header({
  data,
  address,
  workHours,
  hoursNote,
  phone,
  serviceLinks,
}: {
  data: LandingData["header"];
  address: string;
  workHours: string;
  hoursNote: string;
  phone: LandingData["contacts"]["phone"];
  serviceLinks: ServiceLink[];
}) {
  const { openModal } = useModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const { durationBase, easeCinematic } = designTokens.motion;

  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  function renderDesktopNavItem(item: LandingData["header"]["nav"][number]) {
    if (item.href === "#uslugi" && serviceLinks.length > 0) {
      return (
        <div
          key={item.href}
          className="nav-dropdown"
          onMouseEnter={() => setServicesOpen(true)}
          onMouseLeave={() => setServicesOpen(false)}
          onFocus={() => setServicesOpen(true)}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && event.currentTarget.contains(next)) {
              return;
            }
            setServicesOpen(false);
          }}
        >
          <a
            href={item.href}
            aria-haspopup="true"
            aria-expanded={servicesOpen}
          >
            {item.label}
            <span className="nav-chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </a>
          <div className="nav-dropdown-menu" role="menu">
            {serviceLinks.map((link) => (
              <a key={link.slug} href={link.href} role="menuitem">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      );
    }

    return (
      <a key={item.href} href={item.href}>
        {item.label}
      </a>
    );
  }

  function renderMobileNavItem(
    item: LandingData["header"]["nav"][number],
    index: number,
  ) {
    const linkProps = {
      ref: index === 0 ? firstLink : undefined,
      href: item.href,
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.04 + index * 0.035, duration: durationBase * 0.55 },
      onClick: () => setMenuOpen(false),
    } as const;

    if (item.href === "#uslugi" && serviceLinks.length > 0) {
      return (
        <Fragment key={item.href}>
          <motion.a className="mobile-nav-link" {...linkProps}>
            {item.label}
          </motion.a>
          <div className="mobile-nav-services">
            {serviceLinks.map((link, serviceIndex) => (
              <motion.a
                key={link.slug}
                href={link.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.08 + index * 0.035 + (serviceIndex + 1) * 0.025,
                  duration: durationBase * 0.5,
                }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </Fragment>
      );
    }

    return (
      <motion.a key={item.href} className="mobile-nav-link" {...linkProps}>
        {item.label}
      </motion.a>
    );
  }

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="logo" href="#main" aria-label={data.logo.ariaLabel}>
          {data.logo.text}
          <small>Семейный юрист</small>
        </a>
        <p className="header-meta">
          <span>{address}</span>
          <span>{workHours}</span>
          {hoursNote ? (
            <span className="header-meta-note">{hoursNote}</span>
          ) : null}
        </p>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {data.nav.map((item) => renderDesktopNavItem(item))}
        </nav>
        <a
          className="header-phone"
          href={phone.href}
          aria-label={`Позвонить: ${phone.display}`}
        >
          <PhoneIcon />
          <span className="header-phone-number">{phone.display}</span>
        </a>
        <button
          type="button"
          className="header-cta"
          onClick={() => openModal("Шапка сайта")}
        >
          {data.cta.label}
        </button>
        <button
          type="button"
          className={`menu-toggle${menuOpen ? " is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: designTokens.motion.durationFast }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setMenuOpen(false);
            }}
          >
            <motion.div
              className="mobile-menu-panel"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: durationBase * 0.7, ease: easeCinematic }}
            >
              <p className="mobile-menu-brand">
                {data.logo.text}
                <small>Семейный юрист</small>
              </p>
              <nav aria-label="Мобильная навигация">
                {data.nav.map((item, index) =>
                  renderMobileNavItem(item, index),
                )}
              </nav>
              <div className="mobile-menu-footer">
                <p className="mobile-menu-meta">
                  <span>{address}</span>
                  <span>{workHours}</span>
                  {hoursNote ? (
                    <span className="mobile-menu-meta-note">{hoursNote}</span>
                  ) : null}
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("Шапка сайта");
                  }}
                >
                  {data.cta.label}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
