"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useModal } from "@/components/forms/ModalProvider";
import type { LandingData } from "@/modules/content/content.types";

export function Header({
  data,
  address,
  workHours,
}: {
  data: LandingData["header"];
  address: string;
  workHours: string;
}) {
  const { openModal } = useModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

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

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="logo" href="#main" aria-label={data.logo.ariaLabel}>
          {data.logo.text}
          <small>Семейный юрист</small>
        </a>
        <p className="header-meta">
          <span>{address}</span>
          <span aria-hidden="true">·</span>
          <span>{workHours}</span>
        </p>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {data.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
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
            initial={{ opacity: 0, clipPath: "circle(0% at 90% 4%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 90% 4%)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at 90% 4%)" }}
          >
            <nav aria-label="Мобильная навигация">
              {data.nav.map((item, index) => (
                <motion.a
                  ref={index === 0 ? firstLink : undefined}
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.055 }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              <p className="header-meta header-meta-mobile">
                <span>{address}</span>
                <span>{workHours}</span>
              </p>
              <button
                type="button"
                className="button button-light"
                onClick={() => {
                  setMenuOpen(false);
                  openModal("Шапка сайта");
                }}
              >
                {data.cta.label}
              </button>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
