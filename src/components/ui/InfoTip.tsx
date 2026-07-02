import type { ReactNode } from "react";

/** Hover/focus tooltip behind a small "?" button (pure CSS reveal). */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="tip-wrap">
      <button type="button" className="tip-btn" aria-label={label}>
        ?
      </button>
      <span className="tip-body">{children}</span>
    </span>
  );
}
