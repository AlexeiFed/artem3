"use client";

import { useEffect, useState } from "react";

import {
  readCookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";

import { YandexMetrika } from "./YandexMetrika";

interface ConsentGatedMetrikaProps {
  counterId: number;
}

/** Loads Metrika only after cookie consent in this tab. */
export function ConsentGatedMetrika({ counterId }: ConsentGatedMetrikaProps) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(readCookieConsent());
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  if (!allowed) return null;
  return <YandexMetrika counterId={counterId} />;
}
