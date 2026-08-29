import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1_000;
export const SESSION_IDLE_MS = 60 * 60 * 1_000;
export const SESSION_ACTIVITY_INTERVAL_MS = 5 * 60 * 1_000;
export { SESSION_TOKEN_PATTERN } from "./cookie";
export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_TTL_MS / 1_000;

export interface SessionMaterial {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionMaterial(now: Date): SessionMaterial {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  };
}
