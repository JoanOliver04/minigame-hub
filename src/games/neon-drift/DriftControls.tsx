"use client";

import { useLocale } from "@/context/LocaleContext";
import type { useDriftControls } from "./useDriftControls";

export function DriftControls({ bindControl }: { bindControl: ReturnType<typeof useDriftControls> }) {
  const { t } = useLocale();
  return (
    <div className="drift-controls">
      <button type="button" className="btn drift-pad" aria-label={t.neonDrift.steerLeft}
        aria-keyshortcuts="ArrowLeft A" {...bindControl("left")}>◀</button>
      <button type="button" className="btn drift-pad brake" aria-label={t.neonDrift.brake}
        aria-keyshortcuts="ArrowDown S" {...bindControl("brake")}>{t.neonDrift.brakeShort}</button>
      <button type="button" className="btn drift-pad boost" aria-label={t.neonDrift.boost}
        aria-keyshortcuts="Space" {...bindControl("boost")}>{t.neonDrift.boostShort}</button>
      <button type="button" className="btn drift-pad" aria-label={t.neonDrift.steerRight}
        aria-keyshortcuts="ArrowRight D" {...bindControl("right")}>▶</button>
    </div>
  );
}
