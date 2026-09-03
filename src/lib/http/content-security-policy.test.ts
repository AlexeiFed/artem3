import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "../../../content-security-policy";

describe("buildContentSecurityPolicy", () => {
  it("allows blob workers so Yandex Webvisor can run in production", () => {
    const policy = buildContentSecurityPolicy("https://artemsysuev.ru");

    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("skips upgrade-insecure-requests on http so local assets are not forced to https", () => {
    const policy = buildContentSecurityPolicy("http://localhost:3000");

    expect(policy).not.toContain("upgrade-insecure-requests");
    expect(policy).toContain("worker-src 'self' blob:");
  });

  it("uses a per-request nonce instead of script-src unsafe-inline", () => {
    const policy = buildContentSecurityPolicy("https://artemsysuev.ru", "abc123");

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-inline' blob: https://api-maps.yandex.ru");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("allows eval only when React development diagnostics need it", () => {
    const policy = buildContentSecurityPolicy("http://localhost:3000", "devnonce", {
      allowUnsafeEval: true,
    });

    expect(policy).toContain("'unsafe-eval'");
  });
});
