"use client";

import { useState, type FormEvent } from "react";

import { AuthErrorResponseSchema } from "@/modules/auth/auth.schemas";

interface LoginFormProps {
  nextPath?: string;
}

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

export function LoginForm({ nextPath }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (!response.ok) {
        const parsed = AuthErrorResponseSchema.safeParse(await response.json());
        if (!parsed.success) {
          setError("Не удалось выполнить вход. Попробуйте ещё раз.");
          return;
        }
        const { message, attemptsRemaining, attemptsLimit, retryAfterSeconds, resetsAt } =
          parsed.data.error;
        const details: string[] = [message];
        if (
          attemptsRemaining !== undefined &&
          attemptsLimit !== undefined &&
          !message.includes("Осталось попыток")
        ) {
          details.push(
            `Осталось попыток: ${attemptsRemaining} из ${attemptsLimit}.`,
          );
        }
        if (retryAfterSeconds !== undefined && !message.includes("Повторите через")) {
          details.push(`Повтор через ${retryAfterSeconds} с.`);
        }
        if (resetsAt && !message.includes("сброс")) {
          details.push(`Сброс лимита: ${new Date(resetsAt).toLocaleTimeString("ru-RU")}.`);
        }
        setError(details.join(" "));
        return;
      }

      window.location.assign(safeAdminNextPath(nextPath));
    } catch {
      setError("Не удалось выполнить вход. Проверьте соединение.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={submit} noValidate>
      <div className="grid gap-2">
        <label className="font-sans text-sm text-secondary" htmlFor="email">
          Электронная почта
        </label>
        <input
          className="rounded-control border border-sage bg-background px-5 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </div>

      <div className="grid gap-2">
        <label className="font-sans text-sm text-secondary" htmlFor="password">
          Пароль
        </label>
        <input
          className="rounded-control border border-sage bg-background px-5 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={14}
          maxLength={200}
        />
      </div>

      {error ? (
        <p className="text-sm text-secondary" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-control bg-forest px-6 py-3 font-sans font-semibold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
