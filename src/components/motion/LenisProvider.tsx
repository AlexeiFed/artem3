"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

interface SmoothScrollContextValue {
  scrollTo(target: string | number): void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollTo(target) {
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
      return;
    }
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  },
});

const TABS_SCROLL_AIR_PX = 16;

function syncHeaderOffset(): void {
  const header = document.querySelector(".site-header");
  if (!(header instanceof HTMLElement)) return;
  const height = Math.ceil(header.getBoundingClientRect().height);
  if (height <= 0) return;
  document.documentElement.style.setProperty(
    "--site-header-offset",
    `${height}px`,
  );
}

function syncTabsOffset(): void {
  const tabs = document.querySelector(".service-tabs");
  if (!(tabs instanceof HTMLElement)) return;
  const height = Math.ceil(tabs.getBoundingClientRect().height);
  if (height <= 0) return;
  document.documentElement.style.setProperty(
    "--site-tabs-offset",
    `${height + TABS_SCROLL_AIR_PX}px`,
  );
}

function syncStickyOffsets(): void {
  syncHeaderOffset();
  syncTabsOffset();
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    syncStickyOffsets();
    const header = document.querySelector(".site-header");
    const tabs = document.querySelector(".service-tabs");
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncStickyOffsets();
          })
        : null;
    if (header instanceof HTMLElement) observer?.observe(header);
    if (tabs instanceof HTMLElement) observer?.observe(tabs);
    window.addEventListener("resize", syncStickyOffsets);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncStickyOffsets);
    };
  }, [isAdmin, pathname]);

  useEffect(() => {
    // Админка: два независимых overflow-скролла (меню / контент). Lenis их ломает.
    if (isAdmin) return;

    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!media.matches) return;
    syncStickyOffsets();
    const lenis = new Lenis({
      anchors: true,
    });
    lenisRef.current = lenis;
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isAdmin]);

  const scrollTo = useCallback((target: string | number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target);
      return;
    }
    if (typeof target === "number") {
      window.scrollTo({
        top: target,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      return;
    }
    document.querySelector(target)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);
  const value = useMemo(() => ({ scrollTo }), [scrollTo]);

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}
