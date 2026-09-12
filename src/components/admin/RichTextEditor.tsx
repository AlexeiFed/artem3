"use client";

import { useEffect, useRef } from "react";

import {
  HERO_BRASS_CLASS,
  heroMarkupToEditorHtml,
  sanitizeHeroMarkup,
} from "@/lib/hero-markup";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
  label: string;
}

export function RichTextEditor({
  value,
  onChange,
  multiline = true,
  className = "",
  label,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (sanitizeHeroMarkup(el.innerHTML) === sanitizeHeroMarkup(value)) {
      return;
    }
    el.innerHTML = heroMarkupToEditorHtml(value);
  }, [value]);

  function commit(): void {
    const el = editorRef.current;
    if (!el) return;
    onChange(sanitizeHeroMarkup(el.innerHTML));
  }

  function wrapBrass(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.className = HERO_BRASS_CLASS;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const caret = document.createRange();
    caret.selectNodeContents(span);
    caret.collapse(false);
    selection.addRange(caret);
  }

  function apply(command: "bold" | "italic" | "brass"): void {
    editorRef.current?.focus();
    if (command === "bold") {
      document.execCommand("bold");
    } else if (command === "italic") {
      document.execCommand("italic");
    } else {
      wrapBrass();
    }
    commit();
  }

  return (
    <div className="grid gap-2">
      <div
        className="flex flex-wrap gap-2"
        role="toolbar"
        aria-label={`Форматирование: ${label}`}
      >
        <button
          type="button"
          className="rounded border border-sage/40 px-2 py-1 text-xs font-semibold hover:bg-sage/10"
          title="Жирный"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => apply("bold")}
        >
          Ж
        </button>
        <button
          type="button"
          className="rounded border border-sage/40 px-2 py-1 text-xs italic hover:bg-sage/10"
          title="Курсив"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => apply("italic")}
        >
          К
        </button>
        <button
          type="button"
          className="rounded border border-sage/40 px-2 py-1 text-xs text-brass hover:bg-sage/10"
          title="Латунь"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => apply("brass")}
        >
          Латунь
        </button>
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-label={label}
        aria-multiline={multiline}
        contentEditable
        suppressContentEditableWarning
        className={`whitespace-pre-wrap empty:min-h-[1.5lh] ${className}`}
        onInput={commit}
        onBlur={commit}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand(
            "insertText",
            false,
            event.clipboardData.getData("text/plain"),
          );
        }}
        onKeyDown={(event) => {
          if (!multiline && event.key === "Enter") {
            event.preventDefault();
          }
        }}
      />
    </div>
  );
}
