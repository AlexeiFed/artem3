export const HOME_NAV_ITEM = {
  label: "Главная",
  href: "#main",
} as const;

type NavItem = {
  label: string;
  href: string;
};

/** Guarantees "Главная" is first even if CMS/DB nav lost it. */
export function ensureHomeNavItem(nav: readonly NavItem[]): NavItem[] {
  if (nav.some((item) => item.href === HOME_NAV_ITEM.href)) {
    return [...nav];
  }
  return [HOME_NAV_ITEM, ...nav];
}
