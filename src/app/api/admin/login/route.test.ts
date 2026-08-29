import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AuthDomainError } from "@/modules/auth/auth.service";

import { createLoginHandler } from "./route";

const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@example.com",
};

function request(origin = "https://example.test"): Request {
  return new Request("https://example.test/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-real-ip": "203.0.113.5",
    },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "correct-password",
    }),
  });
}

describe("POST /api/admin/login", () => {
  it("sets a strict HttpOnly one-day host cookie without returning the token", async () => {
    const login = vi.fn().mockResolvedValue({
      token: "A".repeat(43),
      expiresAt: new Date("2026-07-19T10:00:00.000Z"),
      user: USER,
    });
    const handler = createLoginHandler({
      login,
      siteUrl: "https://example.test",
      now: () => new Date("2026-07-12T10:00:00.000Z"),
    });

    const response = await handler(request());
    const body: unknown = await response.json();
    const cookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    expect(body).toEqual({ authenticated: true, user: USER });
    expect(JSON.stringify(body)).not.toContain("A".repeat(43));
    expect(cookie).toContain(`__Host-admin_session=${"A".repeat(43)}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(cookie).toMatch(/Max-Age=86400/i);
    expect(cookie).toMatch(/Secure/i);
  });

  it("does not set Secure when the configured site URL is http", async () => {
    const login = vi.fn().mockResolvedValue({
      token: "A".repeat(43),
      expiresAt: new Date("2026-07-19T10:00:00.000Z"),
      user: USER,
    });
    const handler = createLoginHandler({
      login,
      siteUrl: "http://192.0.2.10",
    });

    const response = await handler(
      new Request("http://192.0.2.10/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://192.0.2.10",
          "x-real-ip": "203.0.113.5",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "correct-password",
        }),
      }),
    );
    const cookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    expect(cookie).toContain(`admin_session=${"A".repeat(43)}`);
    expect(cookie).not.toMatch(/;\s*Secure/i);
  });

  it("rejects a mismatched or absent Origin before login", async () => {
    const login = vi.fn();
    const handler = createLoginHandler({
      login,
      siteUrl: "https://example.test",
    });

    const mismatched = await handler(request("https://evil.test"));
    const absent = await handler(
      new Request("https://example.test/api/admin/login", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(mismatched.status).toBe(403);
    expect(absent.status).toBe(403);
    expect(login).not.toHaveBeenCalled();
  });

  it("returns a safe 413 without authenticating an oversized body", async () => {
    const login = vi.fn();
    const handler = createLoginHandler({
      login,
      siteUrl: "https://example.test",
    });
    const oversized = new Request(
      "https://example.test/api/admin/login",
      {
        method: "POST",
        headers: {
          Origin: "https://example.test",
          "Content-Length": "8193",
        },
        body: "{}",
      },
    );

    const response = await handler(oversized);
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(413);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).not.toMatch(/password|argon2|token/i);
    expect(login).not.toHaveBeenCalled();
  });

  it.each([
    ["INVALID_CREDENTIALS", 401],
    ["RATE_LIMITED", 429],
    ["VALIDATION", 400],
    ["PERSISTENCE", 500],
  ] as const)("maps %s to a safe %i response", async (code, status) => {
    const handler = createLoginHandler({
      login: async () => {
        throw new AuthDomainError(code);
      },
      siteUrl: "https://example.test",
    });

    const response = await handler(request());
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(status);
    expect(body).not.toMatch(/password|argon2|token/i);
  });
});
