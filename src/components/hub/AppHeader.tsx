"use client";

import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n/dictionaries";

const LOCALE_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

/** App title, tagline, and the EN/ES language switch. */
export function AppHeader() {
  const { locale, setLocale, t } = useLocale();

  return (
    <header>
      <div className="lang-switch">
        <SegPicker
          options={LOCALE_OPTIONS}
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
        />
      </div>
      <h1>
        {t.app.title} <span className="vs">·</span> {t.app.vsLine}
      </h1>
      <p className="tagline">{t.app.tagline}</p>
    </header>
  );
}
