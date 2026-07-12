import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://api-maps.yandex.ru https://yastatic.net https://mc.yandex.ru https://vk.com https://*.vk.com https://vkvideo.ru https://*.vkvideo.ru",
  "style-src 'self' 'unsafe-inline' https://yastatic.net",
  "img-src 'self' data: blob: https://*.twcstorage.ru https://*.timeweb.cloud https://*.yandex.ru https://*.maps.yandex.net https://yastatic.net https://*.vk.com https://*.vkuser.net https://*.userapi.com",
  "font-src 'self' data: https://yastatic.net",
  "media-src 'self' blob: https://*.twcstorage.ru https://*.timeweb.cloud https://*.vk.com https://*.vkvideo.ru https://*.vkuser.net https://*.userapi.com",
  "frame-src 'self' https://vk.com https://*.vk.com https://vkvideo.ru https://*.vkvideo.ru https://yandex.ru https://*.yandex.ru",
  "connect-src 'self' https://api-maps.yandex.ru https://*.yandex.ru https://*.maps.yandex.net https://mc.yandex.ru https://*.twcstorage.ru https://*.timeweb.cloud https://vk.com https://*.vk.com https://*.vkvideo.ru",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
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
];

const nextConfig: NextConfig = {
  output: "standalone",
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
