export function buildContentSecurityPolicy(
  siteUrl: string,
  nonce?: string,
  options?: { allowUnsafeEval?: boolean },
): string {
  const evalSrc = options?.allowUnsafeEval ? " 'unsafe-eval'" : "";
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${evalSrc} blob:`
    : `script-src 'self' 'unsafe-inline'${evalSrc} blob: https://api-maps.yandex.ru https://yastatic.net https://mc.yandex.ru https://vk.com https://*.vk.com https://vkvideo.ru https://*.vkvideo.ru`;

  const directives: string[] = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://yastatic.net",
    "img-src 'self' data: blob: https://*.twcstorage.ru https://*.timeweb.cloud https://*.yandex.ru https://*.maps.yandex.net https://yastatic.net https://*.vk.com https://*.vkuser.net https://*.userapi.com",
    "font-src 'self' data: https://yastatic.net",
    "media-src 'self' blob: https://*.twcstorage.ru https://*.timeweb.cloud https://*.vk.com https://*.vkvideo.ru https://*.vkuser.net https://*.userapi.com",
    "frame-src 'self' https://vk.com https://*.vk.com https://vkvideo.ru https://*.vkvideo.ru https://yandex.ru https://*.yandex.ru",
    "connect-src 'self' https://api-maps.yandex.ru https://*.yandex.ru https://*.maps.yandex.net https://mc.yandex.ru https://*.twcstorage.ru https://*.timeweb.cloud https://vk.com https://*.vk.com https://*.vkvideo.ru",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (siteUrl.startsWith("https://")) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

export const HSTS_HEADER = "max-age=31536000; includeSubDomains";
