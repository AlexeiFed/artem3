"use client";

import { useEffect, useId, useRef, useState } from "react";

interface ContactsMapProps {
  latitude: number;
  longitude: number;
  externalUrl: string;
  apiKey: string | undefined;
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
        destroy(): void;
      };
      Placemark: new (
        geometry: [number, number],
        properties?: { balloonContent?: string },
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
}: ContactsMapProps) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ destroy(): void } | null>(null);
  const [failed, setFailed] = useState(!apiKey);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let cancelled = false;

    function initMap() {
      if (cancelled || !window.ymaps || !containerRef.current) return;
      window.ymaps.ready(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current?.destroy();
        const map = new window.ymaps!.Map(
          containerRef.current,
          {
            center: [latitude, longitude],
            zoom: 16,
            controls: ["zoomControl"],
          },
          { suppressMapOpenBlock: true },
        );
        map.geoObjects.add(
          new window.ymaps!.Placemark(
            [latitude, longitude],
            {},
            {
              preset: "islands#circleDotIcon",
              iconColor: "#3B5942",
            },
          ),
        );
        mapRef.current = map;
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
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [apiKey, latitude, longitude]);

  if (failed || !apiKey) {
    return (
      <a
        className="map-panel map-panel-fallback"
        href={externalUrl}
        target="_blank"
        rel="noreferrer"
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
        rel="noreferrer"
      >
        Открыть на Яндекс Картах ↗
      </a>
    </div>
  );
}
