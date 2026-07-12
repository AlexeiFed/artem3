"use client";

import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/services", label: "Услуги" },
  { href: "/admin/cases", label: "Кейсы" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/media", label: "Медиа" },
  { href: "/admin/contacts", label: "Контакты" },
  { href: "/admin/leads", label: "Заявки" },
] as const;

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  currentPath: string;
}

export function AdminShell({ children, title, currentPath }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-sage/30 bg-background px-5 py-6 lg:border-b-0 lg:border-r">
        <p className="mb-2 font-sans text-sm text-sage">Админка</p>
        <p className="mb-8 font-display text-3xl text-primary">Артём Сысуев</p>
        <nav aria-label="Разделы админки">
          <ul className="grid gap-2">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/admin"
                  ? currentPath === "/admin"
                  : currentPath.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-control px-4 py-2 font-sans text-sm ${
                      active
                        ? "bg-forest text-background"
                        : "text-secondary hover:bg-sage/10"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          className="mt-10 rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary"
          onClick={() => {
            void fetch("/api/admin/logout", { method: "POST" }).then(() => {
              window.location.assign("/admin/login");
            });
          }}
        >
          Выйти
        </button>
      </aside>
      <div className="px-5 py-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-4xl text-primary">{title}</h1>
          <Link
            href="/"
            className="rounded-control border border-sage px-4 py-2 font-sans text-sm text-secondary"
          >
            Открыть сайт
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
