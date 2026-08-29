export function safeAdminNextPath(value: string | undefined): string {
  if (
    value &&
    value.startsWith("/admin") &&
    !value.startsWith("//") &&
    value !== "/admin/login"
  ) {
    return value;
  }
  return "/admin";
}
