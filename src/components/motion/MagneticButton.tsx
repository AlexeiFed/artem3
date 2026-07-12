"use client";

import type { MouseEventHandler, PointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function MagneticButton({
  children,
  className,
  type = "button",
  onClick,
}: MagneticButtonProps) {
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - box.left - box.width / 2) * 0.16);
    y.set((event.clientY - box.top - box.height / 2) * 0.16);
  }

  return (
    <motion.button
      type={type}
      {...(className === undefined ? {} : { className })}
      {...(onClick === undefined ? {} : { onClick })}
      style={{ x, y }}
      onPointerMove={move}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.button>
  );
}
