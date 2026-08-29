import { readFileSync } from "node:fs";
import path from "node:path";

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

  it("keeps the same worker-src directive inlined in next.config.ts", () => {
    const source = readFileSync(
      path.join(process.cwd(), "next.config.ts"),
      "utf8",
    );
    expect(source).toContain("worker-src 'self' blob:");
    expect(source).toContain("blob: https://api-maps.yandex.ru");
  });
});
