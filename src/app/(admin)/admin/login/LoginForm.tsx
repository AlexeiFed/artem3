"use client";

import { useState, type FormEvent } from "react";

import { AuthErrorResponseSchema } from "@/modules/auth/auth.schemas";
import { safeAdminNextPath } from "@/modules/auth/safe-admin-next-path";

export { safeAdminNextPath };

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const emailInput = form.elements.namedItem("email");
    const passwordInput = form.elements.namedItem("password");
    const email = emailInput instanceof HTMLInputElement ? emailInput.value : "";
    const password =
      passwordInput instanceof HTMLInputElement ? passwordInput.value : "";

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const parsed = AuthErrorResponseSchema.safeParse(await response.json());
        if (!parsed.success) {
          setError("Не удалось выполнить вход. Попробуйте ещё раз.");
          return;
        }
        const { message, retryAfterSeconds, resetsAt } = parsed.data.error;
        const details: string[] = [message];
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
        <div className="relative">
          <input
            className="w-full rounded-control border border-sage bg-background py-3 pr-14 pl-5 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            minLength={14}
            maxLength={200}
          />
          <button
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-control p-1 text-secondary outline-none focus-visible:ring-2 focus-visible:ring-forest"
            type="button"
            aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={passwordVisible}
            aria-controls="password"
            onClick={() => {
              setPasswordVisible((visible) => !visible);
            }}
          >
            <PasswordVisibilityIcon visible={passwordVisible} />
          </button>
        </div>
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

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.6 12s3.6-7 9.4-7 9.4 7 9.4 7-3.6 7-9.4 7-9.4-7-9.4-7z"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {visible ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M4 20 20 4"
        />
      ) : null}
    </svg>
  );
}
