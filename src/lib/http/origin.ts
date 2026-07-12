export function isSameOrigin(request: Request, configuredSiteUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(configuredSiteUrl).origin;
  } catch {
    return false;
  }
}
