"use client";

import { useState, type PointerEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

import type { LandingData } from "@/modules/content/content.types";

export function ContractXRay({
  data,
}: {
  data: LandingData["hiddenRisks"];
}) {
  const [revealed, setRevealed] = useState(false);
  const [probing, setProbing] = useState(false);
  const x = useMotionValue(280);
  const y = useMotionValue(180);
  const mask = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, #000 0%, transparent 42%)`;
  const active = revealed || probing;

  function move(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - box.left);
    y.set(event.clientY - box.top);
  }

  return (
    <section className="xray section">
      <div className="shell xray-grid">
        <div className="xray-copy">
          <p className="eyebrow">{data.eyebrow}</p>
          <h2>{data.title}</h2>
          <p className="lead">{data.copy}</p>
          <p className="xray-hint">
            Наведите курсор на документ — проявятся строки соглашения и опасные
            условия.
          </p>
          <button
            type="button"
            className="xray-reveal-button"
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? "Скрыть опасные условия" : "Показать опасные условия"}
          </button>
        </div>
        <div
          className={`legal-document${active ? " is-revealed" : ""}${revealed ? " is-fully-revealed" : ""}`}
          tabIndex={0}
          onPointerMove={move}
          onPointerDown={(event) => {
            if (revealed) return;
            if (event.pointerType === "touch" || event.pointerType === "pen") {
              setProbing(true);
              move(event);
            }
          }}
          onPointerUp={() => setProbing(false)}
          onPointerCancel={() => setProbing(false)}
          onPointerLeave={() => setProbing(false)}
          aria-label="Документ с выделенными рискованными условиями. Наведите курсор, проведите пальцем по документу или нажмите кнопку, чтобы увидеть опасные условия."
        >
          <div className="legal-document-scan">
            <DocumentLines lines={data.documentLines} />
            <motion.div
              className="document-reveal"
              style={
                revealed
                  ? { maskImage: "none", WebkitMaskImage: "none" }
                  : {
                      maskImage: mask,
                      WebkitMaskImage: mask,
                      opacity: probing ? 1 : undefined,
                    }
              }
            >
              <DocumentLines lines={data.documentLines} />
            </motion.div>
          </div>
          <div className="toxic-clauses">
            <p className="toxic-clauses-heading">Опасные условия</p>
            {data.toxicClauses.map((item) => (
              <article key={item.clause}>
                <strong>{item.clause}</strong>
                <p>{item.risk}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DocumentLines({ lines }: { lines: string[] }) {
  return (
    <div className="document-copy" aria-hidden="true">
      <small>Соглашение сторон</small>
      {lines.map((line, index) => (
        <p key={line}>
          <span>{index + 1}.</span> {line}
        </p>
      ))}
    </div>
  );
}
