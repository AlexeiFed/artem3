"use client";

import {
  type ChangeEvent,
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

interface ModalFormProps {
  service: string | undefined;
  metrikaId: number | undefined;
  onClose(): void;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]';

const SUCCESS_COPY =
  "Спасибо, заявка принята! Я изучу вашу ситуацию и свяжусь с вами в ближайшее время. Обычно отвечаю в течение 15–30 минут в рабочее время.";

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

  const canSubmit = isDataAgreed && status !== "sending";

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
              <h2 id={titleId}>Заявка принята</h2>
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
              <h2 id={titleId}>Обсудить ситуацию</h2>
              <p className="modal-subtitle">
                Без обязательств. Я свяжусь с вами и скажу возможные варианты
                решения ситуации.
              </p>
              {service ? <p className="modal-service">{service}</p> : null}

              <div className="modal-field-row">
                <div className="modal-field">
                  <label htmlFor="lead-name">Имя</label>
                  <input
                    id="lead-name"
                    ref={nameRef}
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={onNameChange}
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
                    placeholder="+7 (___) ___-__-__"
                    value={phone}
                    onChange={onPhoneChange}
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
                Ситуация <span>(необязательно)</span>
                <textarea
                  id="lead-situation"
                  name="situation"
                  rows={3}
                  value={situation}
                  onChange={(event) => setSituation(event.target.value)}
                />
              </label>

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
                    Нажимая кнопку &laquo;Отправить заявку&raquo;, я соглашаюсь на
                    обработку моих персональных данных в соотв. с ФЗ от 27.07.2006
                    №152-ФЗ на условиях и для целей, определенных{" "}
                    <a href="/personal-data" target="_blank" rel="noreferrer">
                      Согласием на обработку персональных данных
                    </a>
                    , на условиях и для целей, определенных{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer">
                      Политикой конфиденциальности
                    </a>
                    .
                  </span>
                </label>
              </fieldset>

              {status === "error" ? (
                <p role="alert" className="form-error">
                  Не удалось отправить заявку. Данные сохранены — попробуйте ещё
                  раз.
                </p>
              ) : null}
              <button
                className={`button${canSubmit ? "" : " button-disabled"}`}
                type="submit"
                disabled={!canSubmit}
              >
                {status === "sending" ? "Отправляем…" : "Отправить заявку"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
