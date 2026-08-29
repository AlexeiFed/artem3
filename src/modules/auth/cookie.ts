export const ADMIN_SESSION_COOKIE = "admin_session";
export const HOST_ADMIN_SESSION_COOKIE = "__Host-admin_session";
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function sessionCookieName(secure: boolean): string {
  return secure ? HOST_ADMIN_SESSION_COOKIE : ADMIN_SESSION_COOKIE;
}

export function hasSessionCookie(cookies: {
  has(name: string): boolean;
}): boolean {
  return (
    cookies.has(HOST_ADMIN_SESSION_COOKIE) || cookies.has(ADMIN_SESSION_COOKIE)
  );
}

export function readSessionTokenFromStore(store: {
  get(name: string): { value: string } | undefined;
}): string | undefined {
  return (
    store.get(HOST_ADMIN_SESSION_COOKIE)?.value ??
    store.get(ADMIN_SESSION_COOKIE)?.value
  );
}

export function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  let fallback: string | null = null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    const value = valueParts.join("=");
    if (value.length === 0) {
      continue;
    }
    if (name === HOST_ADMIN_SESSION_COOKIE) {
      return value;
    }
    if (name === ADMIN_SESSION_COOKIE) {
      fallback = value;
    }
  }

  return fallback;
}

export function serializeSessionCookie(token: string, secure: boolean): string {
  const maxAge = 24 * 60 * 60;
  return [
    `${sessionCookieName(secure)}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function expiredSessionCookies(secure: boolean): string[] {
  const flags = [
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
    ...(secure ? ["Secure"] : []),
  ];
  return [
    `${ADMIN_SESSION_COOKIE}=; ${flags.join("; ")}`,
    `${HOST_ADMIN_SESSION_COOKIE}=; ${flags.join("; ")}`,
  ];
}
