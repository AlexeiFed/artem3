"use client";

import type { PointerEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

import type { LandingData } from "@/modules/content/content.types";

export function ContractXRay({
  data,
}: {
  data: LandingData["hiddenRisks"];
}) {
  const x = useMotionValue(280);
  const y = useMotionValue(180);
  const mask = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, #000 0%, transparent 42%)`;

  function move(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - box.left);
    y.set(event.clientY - box.top);
  }

  return (
    <section className="xray section">
      <div className="shell xray-grid">
        <div>
          <p className="eyebrow">{data.eyebrow}</p>
          <h2>{data.title}</h2>
          <p className="lead">{data.copy}</p>
          <p className="xray-hint">
            Наведите курсор на документ — проявятся строки соглашения и опасные
            условия.
          </p>
        </div>
        <div
          className="legal-document"
          tabIndex={0}
          onPointerMove={move}
          aria-label="Документ с выделенными рискованными условиями. Наведите курсор или сфокусируйте блок, чтобы увидеть опасные условия."
        >
          <div className="legal-document-scan">
            <DocumentLines lines={data.documentLines} />
            <motion.div
              className="document-reveal"
              style={{
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
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
