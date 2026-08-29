"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  formatRussianPhoneMask,
  validatePersonName,
  validateRussianPhoneInput,
} from "@/modules/leads/lead-form.validation";
import { PERSONAL_DATA_PROCESSING_POLICY_TITLE_DATIVE } from "@/modules/content/legal-copy";
import { PERSONAL_DATA_CONSENT_VERSION } from "@/modules/leads/personal-data-consent";

interface ModalFormProps {
  service: string | undefined;
  metrikaId: number | undefined;
  onClose(): void;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]';

const SUCCESS_COPY =
  "Свяжусь с вами в течение 1 часа в рабочее время (с 9:00 до 18:00 по Хабаровску), чтобы уточнить детали обращения.";

const HIDDEN_SERVICE_BADGES = new Set([
  "Шапка сайта",
  "Контакты",
  "Главный экран",
  "Hero",
  "FAQ",
]);

export function ModalForm({
  service,
  metrikaId,
  onClose,
}: ModalFormProps) {
  const titleId = useId();
  const consentHeadingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [situation, setSituation] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isDataAgreed, setIsDataAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = isDataAgreed && status !== "sending";
  const serviceBadge =
    service && !HIDDEN_SERVICE_BADGES.has(service) ? service : undefined;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus({ preventScroll: true });

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

  /** Клавиатура перекрывает поле — сдвигаем карточку формы, не скроллим поля внутри. */
  function revealField(
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const scroller = dialogRef.current?.parentElement;
    if (!(scroller instanceof HTMLElement)) return;

    const viewport = window.visualViewport;
    const viewBottom =
      (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
    const delta =
      event.currentTarget.getBoundingClientRect().bottom - viewBottom + 24;
    if (delta > 0) {
      scroller.scrollBy({ top: delta, behavior: "smooth" });
    }
  }

  useEffect(() => {
    // На iOS клавиатура сжимает visualViewport, но не 100dvh — панель уезжала под неё.
    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--modal-viewport",
        `${viewport.height}px`,
      );
      document.documentElement.style.setProperty(
        "--modal-viewport-offset",
        `${viewport.offsetTop}px`,
      );
    };
    syncHeight();
    viewport.addEventListener("resize", syncHeight);
    viewport.addEventListener("scroll", syncHeight);

    return () => {
      viewport.removeEventListener("resize", syncHeight);
      viewport.removeEventListener("scroll", syncHeight);
      document.documentElement.style.removeProperty("--modal-viewport");
      document.documentElement.style.removeProperty("--modal-viewport-offset");
    };
  }, []);

  function onPhoneChange(event: ChangeEvent<HTMLInputElement>) {
    setPhone(formatRussianPhoneMask(event.target.value));
    setErrors((current) =>
      current.phone ? { ...(current.name ? { name: current.name } : {}) } : current,
    );
  }

  function onNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
    setErrors((current) =>
      current.name
        ? { ...(current.phone ? { phone: current.phone } : {}) }
        : current,
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDataAgreed) return;

    const nameError = validatePersonName(name);
    const phoneError = validateRussianPhoneInput(phone);

    const nextErrors = {
      ...(nameError ? { name: nameError } : {}),
      ...(phoneError ? { phone: phoneError } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    setSubmitError(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          situation,
          service,
          website: "",
          isDataAgreed: true,
          isMarketingAgreed: false,
        }),
      });
      if (response.status === 422) {
        const body = (await response.json()) as {
          error?: { fields?: Record<string, string[]> };
        };
        const fields = body.error?.fields ?? {};
        setErrors({
          ...(fields.name?.[0] ? { name: fields.name[0] } : {}),
          ...(fields.phone?.[0] ? { phone: fields.phone[0] } : {}),
        });
        setStatus("idle");
        return;
      }
      if (response.status === 429) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setSubmitError(
          body.error?.message ?? "Слишком много заявок. Попробуйте позже.",
        );
        setStatus("error");
        return;
      }
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
              <h2 id={titleId} className="modal-success-title">
                Спасибо за обращение!
                <br />
                Заявка принята.
              </h2>
              <p>{SUCCESS_COPY}</p>
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
              <h2 id={titleId}>Обсудить ваш вопрос</h2>
              <p className="modal-subtitle">
                Без обязательств. Уточню детали обращения и помогу разобраться в
                возможных вариантах действий.
              </p>
              {serviceBadge ? (
                <p className="modal-service">{serviceBadge}</p>
              ) : null}

              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="lead-name">Ваше имя</label>
                  <input
                    id="lead-name"
                    ref={nameRef}
                    name="name"
                    autoComplete="name"
                    placeholder="Введите имя"
                    value={name}
                    onChange={onNameChange}
                    onFocus={revealField}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? "lead-name-error" : undefined}
                  />
                  {errors.name ? (
                    <p id="lead-name-error" className="field-error" role="alert">
                      {errors.name}
                    </p>
                  ) : null}
                </div>
                <div className="modal-field">
                  <label htmlFor="lead-phone">Телефон</label>
                  <input
                    id="lead-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Введите номер телефона"
                    value={phone}
                    onChange={onPhoneChange}
                    onFocus={revealField}
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={
                      errors.phone ? "lead-phone-error" : undefined
                    }
                  />
                  {errors.phone ? (
                    <p id="lead-phone-error" className="field-error" role="alert">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>

              <label className="modal-field" htmlFor="lead-situation">
                Суть вопроса
                <textarea
                  id="lead-situation"
                  name="situation"
                  rows={3}
                  placeholder="Например: развод, есть ребёнок, квартира в ипотеке. Хочу понять свои варианты."
                  value={situation}
                  onChange={(event) => setSituation(event.target.value)}
                  onFocus={revealField}
                />
              </label>
              <p className="form-legal-hint">
                Не указывайте ФИО детей, паспортные данные, диагнозы и сведения
                о третьих лицах — достаточно общей фабулы.
              </p>

              <fieldset className="form-legal" aria-labelledby={consentHeadingId}>
                <legend id={consentHeadingId} className="form-legal-heading">
                  Обязательно отметьте поле ниже
                </legend>

                <label className="form-legal-item">
                  <input
                    type="checkbox"
                    checked={isDataAgreed}
                    onChange={(event) => setIsDataAgreed(event.target.checked)}
                  />
                  <span>
                    Даю согласие на обработку персональных данных согласно{" "}
                    <a href="/personal-data" target="_blank" rel="noreferrer">
                      Согласию на обработку персональных данных
                    </a>{" "}
                    (ред. от{" "}
                    {PERSONAL_DATA_CONSENT_VERSION.split("-").reverse().join(".")}
                    ) и{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer">
                      {PERSONAL_DATA_PROCESSING_POLICY_TITLE_DATIVE}
                    </a>
                    .
                  </span>
                </label>
              </fieldset>

              {status === "error" ? (
                <p role="alert" className="form-error">
                  {submitError ??
                    "Не удалось отправить заявку. Данные сохранены — попробуйте ещё раз."}
                </p>
              ) : null}
              <button
                className={`button${canSubmit ? "" : " button-disabled"}`}
                type="submit"
                disabled={!canSubmit}
              >
                {status === "sending" ? "Отправляем…" : "Получить план действий"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
