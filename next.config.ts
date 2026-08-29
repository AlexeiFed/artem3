import type { NextConfig } from "next";

import { HSTS_HEADER } from "./content-security-policy";

const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  ...((process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://")
    ? [{ key: "Strict-Transport-Security", value: HSTS_HEADER }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["argon2"],
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
