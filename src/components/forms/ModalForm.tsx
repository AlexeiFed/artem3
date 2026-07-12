"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";

interface ModalFormProps {
  service: string | undefined;
  metrikaId: number | undefined;
  onClose(): void;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]';

export function ModalForm({
  service,
  metrikaId,
  onClose,
}: ModalFormProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const nextErrors = {
      ...(name.length < 2 ? { name: "Введите имя" } : {}),
      ...(!phone ? { phone: "Введите телефон" } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          situation: String(form.get("situation") ?? ""),
          service,
          website: "",
        }),
      });
      if (response.status !== 201) throw new Error("Lead request failed");
      setStatus("success");
      if (metrikaId && window.ym) {
        window.ym(metrikaId, "reachGoal", "lead_success");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel"
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <button
          type="button"
          className="icon-button modal-close"
          aria-label="Закрыть форму"
          onClick={onClose}
        >
          ×
        </button>
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              className="modal-success"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="eyebrow">Заявка отправлена</p>
              <h2 id={titleId}>Спасибо, заявка получена.</h2>
              <p>Я свяжусь с вами в рабочее время, чтобы уточнить детали.</p>
              <button type="button" className="button" onClick={onClose}>
                Хорошо
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              initial={false}
              animate={{ opacity: 1 }}
              noValidate
            >
              <p className="eyebrow">Конфиденциально</p>
              <h2 id={titleId}>Обсудить ситуацию</h2>
              {service ? <p className="modal-service">{service}</p> : null}
              <label>
                Имя
                <input ref={nameRef} name="name" autoComplete="name" />
              </label>
              {errors.name ? <p className="field-error">{errors.name}</p> : null}
              <label>
                Телефон
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
              {errors.phone ? (
                <p className="field-error">{errors.phone}</p>
              ) : null}
              <label>
                Ситуация <span>(необязательно)</span>
                <textarea name="situation" rows={4} />
              </label>
              {status === "error" ? (
                <p role="alert" className="form-error">
                  Не удалось отправить заявку. Данные сохранены — попробуйте ещё
                  раз.
                </p>
              ) : null}
              <button
                className="button"
                type="submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Отправляем…" : "Отправить заявку"}
              </button>
              <p className="form-privacy">
                Отправляя форму, вы соглашаетесь на обработку персональных
                данных.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
