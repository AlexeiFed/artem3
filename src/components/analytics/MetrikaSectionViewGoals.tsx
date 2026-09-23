"use client";

import { useEffect } from "react";

const VIEW_GOALS = {
  practice: "practice_view",
  contacts: "contacts_view",
} as const;

type ViewGoal = (typeof VIEW_GOALS)[keyof typeof VIEW_GOALS];

interface MetrikaSectionViewGoalsProps {
  counterId: number;
}

/** Fires a Metrika goal once when the practice or contacts block enters the viewport. */
export function MetrikaSectionViewGoals({
  counterId,
}: MetrikaSectionViewGoalsProps) {
  useEffect(() => {
    const pending = new Set<ViewGoal>();
    const sent = new Set<ViewGoal>();
    let timer = 0;

    const flush = () => {
      const ym = window.ym;
      if (!ym) return;
      for (const goal of [...pending]) {
        ym(counterId, "reachGoal", goal);
        pending.delete(goal);
        sent.add(goal);
      }
      if (timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };

    const ensureTimer = () => {
      if (timer || pending.size === 0 || window.ym) return;
      timer = window.setInterval(flush, 300);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const goal = VIEW_GOALS[entry.target.id as keyof typeof VIEW_GOALS];
        if (!goal || sent.has(goal) || pending.has(goal)) continue;
        pending.add(goal);
      }
      flush();
      ensureTimer();
    });

    for (const id of Object.keys(VIEW_GOALS)) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => {
      observer.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, [counterId]);

  return null;
}
