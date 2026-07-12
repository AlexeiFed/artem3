import { describe, expect, it } from "vitest";

import { extractTrustedClientIp } from "./client-ip";

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe("extractTrustedClientIp", () => {
  it("ignores attacker-prepended XFF values and selects from the right", () => {
    expect(
      extractTrustedClientIp(
        headers({
          "x-forwarded-for": "6.6.6.6, 203.0.113.42",
          "x-real-ip": "198.51.100.10",
        }),
        1,
      ),
    ).toBe("203.0.113.42");
  });

  it.each([
    ["203.0.113.42", "203.0.113.42"],
    ["2001:db8::42", "2001:db8::42"],
  ])("accepts trusted IPv4/IPv6 %s", (forwarded, expected) => {
    expect(
      extractTrustedClientIp(
        headers({ "x-forwarded-for": forwarded }),
        1,
      ),
    ).toBe(expected);
  });

  it("selects the configured hop from the right", () => {
    expect(
      extractTrustedClientIp(
        headers({
          "x-forwarded-for": "203.0.113.42, 198.51.100.8, 192.0.2.5",
        }),
        2,
      ),
    ).toBe("198.51.100.8");
  });

  it("rejects a malformed forwarded chain and uses validated x-real-ip", () => {
    expect(
      extractTrustedClientIp(
        headers({
          "x-forwarded-for": "203.0.113.42, not-an-ip",
          "x-real-ip": "2001:db8::10",
        }),
        1,
      ),
    ).toBe("2001:db8::10");
  });

  it("uses validated x-real-ip when the trusted chain is absent", () => {
    expect(
      extractTrustedClientIp(headers({ "x-real-ip": "198.51.100.10" }), 1),
    ).toBe("198.51.100.10");
  });

  it.each([
    {},
    { "x-forwarded-for": "unknown" },
    { "x-real-ip": "203.0.113.42, 198.51.100.1" },
    { "x-forwarded-for": "203.0.113.42", "x-real-ip": "invalid" },
  ])("returns the fail-closed unknown bucket for invalid headers", (values) => {
    expect(extractTrustedClientIp(headers(values), 2)).toBe("unknown");
  });
});
