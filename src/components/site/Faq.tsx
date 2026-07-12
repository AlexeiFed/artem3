"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { LandingData } from "@/modules/content/content.types";

export function Faq({ items }: { items: LandingData["faqs"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="faq section shell">
      <p className="eyebrow">Вопросы</p>
      <h2>Коротко о важном</h2>
      <div className="faq-list">
        {items.map((item, index) => {
          const open = openIndex === index;
          const panelId = `faq-panel-${index}`;
          return (
            <article key={item.question}>
              <h3>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  {item.question}
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: open ? 45 : 0 }}
                  >
                    +
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    id={panelId}
                    initial={false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="faq-answer"
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}
