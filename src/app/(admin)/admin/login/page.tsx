import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthDomainError } from "@/modules/auth/auth.service";
import { requireAdmin } from "@/modules/auth/require-admin";
import { safeAdminNextPath } from "@/modules/auth/safe-admin-next-path";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход в административную панель",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const next = (await searchParams).next;
  const nextPath = safeAdminNextPath(typeof next === "string" ? next : undefined);

  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthDomainError && error.code === "UNAUTHORIZED") {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-5 py-12">
          <section
            className="w-full max-w-md rounded-panel bg-background p-8 shadow-lift"
            aria-labelledby="login-title"
          >
            <p className="mb-3 font-sans text-sm text-sage">Закрытый раздел</p>
            <h1
              className="mb-3 font-display text-4xl text-primary"
              id="login-title"
            >
              Вход для администратора
            </h1>
            <p className="mb-8 font-sans text-secondary">
              Введите рабочую почту и пароль.
            </p>
            <LoginForm nextPath={nextPath} />
          </section>
        </main>
      );
    }
    throw error;
  }

  redirect(nextPath);
}
