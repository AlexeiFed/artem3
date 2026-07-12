export const ADMIN_SESSION_COOKIE = "admin_session";

export function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === ADMIN_SESSION_COOKIE) {
      const value = valueParts.join("=");
      return value.length > 0 ? value : null;
    }
  }

  return null;
}

export function expiredSessionCookie(production: boolean): string {
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
    ...(production ? ["Secure"] : []),
  ].join("; ");
}
