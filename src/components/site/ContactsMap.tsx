"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  readCookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";
import { designTokens } from "@/lib/design-tokens";

interface ContactsMapProps {
  latitude: number;
  longitude: number;
  externalUrl: string;
  apiKey: string | undefined;
  address?: string;
}

declare global {
  interface Window {
    ymaps?: {
      ready(callback: () => void): void;
      Map: new (
        element: HTMLElement | string,
        state: {
          center: [number, number];
          zoom: number;
          controls: string[];
        },
        options?: { suppressMapOpenBlock?: boolean },
      ) => {
        geoObjects: { add(object: unknown): void };
        setCenter(center: [number, number], zoom?: number): void;
        container: { fitToViewport(): void };
        destroy(): void;
      };
      Placemark: new (
        geometry: [number, number],
        properties?: {
          balloonContentHeader?: string;
          balloonContentBody?: string;
          hintContent?: string;
          iconCaption?: string;
        },
        options?: {
          preset?: string;
          iconColor?: string;
        },
      ) => unknown;
    };
  }
}

const SCRIPT_ID = "yandex-maps-api-2-1";

export function ContactsMap({
  latitude,
  longitude,
  externalUrl,
  apiKey,
  address = "г. Хабаровск, ул. Ленина, 22, офис 12",
}: ContactsMapProps) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ destroy(): void } | null>(null);
  const [failed, setFailed] = useState(!apiKey);
  const [trackingAllowed, setTrackingAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setTrackingAllowed(readCookieConsent());
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  useEffect(() => {
    if (!trackingAllowed || !apiKey || !containerRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    function initMap() {
      if (cancelled || !window.ymaps || !containerRef.current) return;
      window.ymaps.ready(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current?.destroy();
        resizeObserver?.disconnect();
        const center: [number, number] = [latitude, longitude];
        const map = new window.ymaps!.Map(
          containerRef.current,
          {
            center,
            zoom: 17,
            controls: ["zoomControl"],
          },
          { suppressMapOpenBlock: true },
        );
        map.geoObjects.add(
          new window.ymaps!.Placemark(
            center,
            {
              iconCaption: "Офис",
              hintContent: "Офис Артёма Сысуева",
              balloonContentHeader: "Офис Артёма Сысуева",
              balloonContentBody: address,
            },
            {
              preset: "islands#darkGreenStretchyIcon",
              iconColor: designTokens.color.accentSage,
            },
          ),
        );
        map.container.fitToViewport();
        map.setCenter(center, 17);
        mapRef.current = map;

        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            map.container.fitToViewport();
          });
          resizeObserver.observe(containerRef.current);
        }
      });
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing && window.ymaps) {
      initMap();
    } else if (existing) {
      existing.addEventListener("load", initMap);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
      script.async = true;
      script.onload = initMap;
      script.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [address, apiKey, latitude, longitude, trackingAllowed]);

  if (!trackingAllowed || failed || !apiKey) {
    return (
      <a
        className="map-panel map-panel-fallback"
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Открыть адрес на Яндекс Картах"
      >
        <strong>Хабаровск</strong>
        <small>Открыть на Яндекс Картах ↗</small>
      </a>
    );
  }

  return (
    <div className="map-panel map-panel-live">
      <div
        ref={containerRef}
        id={`ymap-${mapId}`}
        className="map-canvas"
        role="region"
        aria-label="Карта офиса на Яндекс Картах"
      />
      <a
        className="map-panel-link"
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Открыть на Яндекс Картах ↗
      </a>
    </div>
  );
}
