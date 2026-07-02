"use client";

/**
 * "How to play" help button + accessible modal, shown on every game's setup
 * screen. The button pins to the card's top-right corner (CSS); the modal is
 * a focus-managed dialog (Escape / backdrop / close button all dismiss it and
 * restore focus to the trigger).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/context/LocaleContext";

export function HowToPlay({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="htp-btn"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">?</span> {t.common.howToPlay}
      </button>

      {open && (
        <div className="htp-overlay" role="presentation" onClick={close}>
          <div
            className="htp-modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="htp-head">
              <h2 className="htp-title">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                className="htp-close"
                aria-label={t.common.close}
                onClick={close}
              >
                ×
              </button>
            </div>
            <div className="htp-body">{children}</div>
            <div className="btn-row">
              <button className="btn primary" onClick={close}>
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
