import "server-only";

import dns from "node:dns/promises";
import fs from "node:fs";
import { request as httpsRequest } from "node:https";
import path from "node:path";

import { getServerEnv } from "@/lib/env/server";

/**
 * Устойчивый клиент Telegram Bot API (паттерн Titan).
 * На Timeweb DNS часто отдаёт заблокированный IP api.telegram.org → timeout.
 * Ходим на живой DC IP с SNI=api.telegram.org; опционально TELEGRAM_API_BASE.
 */

const TELEGRAM_HOST = "api.telegram.org";
const CACHE_FILE = path.join("/tmp", "artem-telegram-api-ip.cache");
const REQUEST_TIMEOUT_MS = 8_000;

const BUILTIN_IPS = [
  "149.154.167.220",
  "149.154.167.50",
  "149.154.167.51",
  "149.154.167.91",
  "149.154.167.99",
  "149.154.171.5",
  "149.154.166.120",
];

let stickyIp: string | null = null;

export function resetTelegramBotApiStateForTests(): void {
  stickyIp = null;
}

function readCachedIp(): string | null {
  try {
    const ip = fs.readFileSync(CACHE_FILE, "utf8").trim();
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip) ? ip : null;
  } catch {
    return null;
  }
}

function writeCachedIp(ip: string): void {
  try {
    fs.writeFileSync(CACHE_FILE, ip, "utf8");
  } catch {
    // cache is best-effort
  }
}

function envIps(): string[] {
  const env = getServerEnv();
  const raw = env.TELEGRAM_API_IPS ?? env.TELEGRAM_API_IP ?? "";
  return raw
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value));
}

async function candidateIps(): Promise<string[]> {
  let dnsIps: string[] = [];
  try {
    dnsIps = await dns.resolve4(TELEGRAM_HOST);
  } catch {
    // DNS may be broken or return only dead IPs
  }

  const ordered = [
    stickyIp,
    readCachedIp(),
    ...envIps(),
    ...BUILTIN_IPS,
    ...dnsIps,
  ].filter((ip): ip is string => Boolean(ip));

  return [...new Set(ordered)];
}

type HttpResult = { status: number; body: string };

function httpsJsonViaIp(
  ip: string,
  urlPath: string,
  method: string,
  body?: string,
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string | number> = {
      Host: TELEGRAM_HOST,
      Accept: "application/json",
      "User-Agent": "artem-vibespace/1.0",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = httpsRequest(
      {
        host: ip,
        servername: TELEGRAM_HOST,
        path: urlPath,
        method,
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("timeout", () =>
      req.destroy(new Error(`Telegram API timeout via ${ip}`)),
    );
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

function httpsJsonViaBase(
  base: string,
  urlPath: string,
  method: string,
  body?: string,
): Promise<HttpResult> {
  const url = new URL(base.replace(/\/$/, "") + urlPath);
  return new Promise((resolve, reject) => {
    const headers: Record<string, string | number> = {
      Accept: "application/json",
      "User-Agent": "artem-vibespace/1.0",
      Host: url.host,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = httpsRequest(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("timeout", () =>
      req.destroy(new Error(`Telegram API timeout via base ${base}`)),
    );
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

export type TelegramApiResponse<T = unknown> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

export async function telegramBotCall<T = unknown>(
  botToken: string,
  method: string,
  payload?: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
  const urlPath = `/bot${botToken}/${method}`;
  const body = payload ? JSON.stringify(payload) : undefined;
  const httpMethod = payload ? "POST" : "GET";
  const errors: string[] = [];

  const base = getServerEnv().TELEGRAM_API_BASE;
  if (base) {
    try {
      const res = await httpsJsonViaBase(base, urlPath, httpMethod, body);
      const data = JSON.parse(res.body) as TelegramApiResponse<T>;
      if (res.status >= 200 && res.status < 500) {
        return data;
      }
      errors.push(`base ${base}: HTTP ${res.status}`);
    } catch (error) {
      errors.push(
        `base ${base}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const ips = await candidateIps();
  for (const ip of ips) {
    try {
      const res = await httpsJsonViaIp(ip, urlPath, httpMethod, body);
      if (res.status === 0) {
        errors.push(`${ip}: empty status`);
        continue;
      }
      stickyIp = ip;
      writeCachedIp(ip);
      return JSON.parse(res.body) as TelegramApiResponse<T>;
    } catch (error) {
      if (stickyIp === ip) stickyIp = null;
      errors.push(
        `${ip}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(
    `Telegram API unreachable. Tried: ${errors.join(" | ")}. ` +
      "Set TELEGRAM_API_IP / TELEGRAM_API_IPS or TELEGRAM_API_BASE.",
  );
}
