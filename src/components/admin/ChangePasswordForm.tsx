"use client";

import { useState, type FormEvent } from "react";

import { AuthErrorResponseSchema } from "@/modules/auth/auth.schemas";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const parsed = AuthErrorResponseSchema.safeParse(payload);
        throw new Error(
          parsed.success
            ? parsed.data.error.message
            : "Не удалось сменить пароль",
        );
      }
      setSuccess(true);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось сменить пароль",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid max-w-md gap-5" onSubmit={onSubmit} noValidate>
      <p className="font-sans text-sm text-secondary">
        Минимум 14 символов. Другие сессии админки будут завершены, текущая
        останется.
      </p>
      <div className="grid gap-2">
        <label className="font-sans text-sm text-secondary" htmlFor="currentPassword">
          Текущий пароль
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          minLength={14}
          maxLength={200}
          className="rounded-control border border-sage bg-background px-5 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
        />
      </div>
      <div className="grid gap-2">
        <label className="font-sans text-sm text-secondary" htmlFor="newPassword">
          Новый пароль
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={14}
          maxLength={200}
          className="rounded-control border border-sage bg-background px-5 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
        />
      </div>
      <div className="grid gap-2">
        <label
          className="font-sans text-sm text-secondary"
          htmlFor="confirmPassword"
        >
          Повтор нового пароля
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={14}
          maxLength={200}
          className="rounded-control border border-sage bg-background px-5 py-3 text-primary outline-none focus-visible:ring-2 focus-visible:ring-forest"
        />
      </div>
      {error ? (
        <p className="font-sans text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="font-sans text-sm text-sage" role="status">
          Пароль обновлён.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-card bg-forest px-6 py-3 font-sans font-semibold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50"
      >
        {pending ? "Сохраняю…" : "Сменить пароль"}
      </button>
    </form>
  );
}
