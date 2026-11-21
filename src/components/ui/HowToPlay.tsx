"use client";

/**
 * "How to play" help button + accessible modal, shown on every game's setup
 * screen. The button pins to the card's top-right corner (CSS); the modal is
 * a focus-managed dialog (Escape / backdrop / close button all dismiss it and
 * restore focus to the trigger).
 */

import { useId, useRef, type MouseEvent, type ReactNode } from "react";
import { useLocale } from "@/context/LocaleContext";

export function HowToPlay({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useLocale();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const { left, top, right, bottom } = event.currentTarget.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      event.currentTarget.close();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="htp-btn"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <span aria-hidden="true">?</span> {t.common.howToPlay}
      </button>

      <dialog
        ref={dialogRef}
        className="htp-modal"
        aria-labelledby={titleId}
        onClose={() => triggerRef.current?.focus()}
        onClick={closeFromBackdrop}
      >
        <div className="htp-head">
          <h2 className="htp-title" id={titleId}>{title}</h2>
          <button type="button" className="htp-close" aria-label={t.common.close} onClick={() => dialogRef.current?.close()}>
            ×
          </button>
        </div>
        <div className="htp-body">{children}</div>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => dialogRef.current?.close()}>
            {t.common.close}
          </button>
        </div>
      </dialog>
    </>
  );
}
