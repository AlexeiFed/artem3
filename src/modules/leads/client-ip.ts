import { isIP } from "node:net";

export const UNKNOWN_CLIENT_IP_BUCKET = "unknown";

export function extractTrustedClientIp(
  headers: Headers,
  trustedProxyHops: number,
): string {
  const forwardedFor = headers.get("x-forwarded-for");

  if (
    forwardedFor &&
    Number.isInteger(trustedProxyHops) &&
    trustedProxyHops >= 1
  ) {
    const chain = forwardedFor.split(",").map((entry) => entry.trim());
    const chainIsValid =
      chain.length >= trustedProxyHops &&
      chain.every((entry) => isIP(entry) !== 0);

    if (chainIsValid) {
      return (
        chain[chain.length - trustedProxyHops] ?? UNKNOWN_CLIENT_IP_BUCKET
      );
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp) !== 0) {
    return realIp;
  }

  return UNKNOWN_CLIENT_IP_BUCKET;
}
