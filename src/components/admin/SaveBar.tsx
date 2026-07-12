"use client";

interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
}

export function SaveBar({ dirty, saving }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-sage/30 bg-background py-4">
      <p className="font-sans text-sm text-secondary">
        {dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
      </p>
      <button
        type="submit"
        className="rounded-control bg-forest px-6 py-3 font-sans font-semibold text-background disabled:opacity-50"
        disabled={!dirty || saving}
      >
        {saving ? "Сохраняем…" : "Сохранить"}
      </button>
    </div>
  );
}
