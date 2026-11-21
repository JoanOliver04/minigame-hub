"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { useStoredPreference } from "@/lib/useStoredPreference";

const STORAGE_KEY = "miniHubLocale_v1";

interface LocaleApi {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleApi | null>(null);

function parseLocale(value: string | null): Locale | null {
  return value === "en" || value === "es" ? value : null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useStoredPreference<Locale>(STORAGE_KEY, "en", parseLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "es"
        ? `${dictionaries.es.app.title} — ${dictionaries.es.app.vsLine}`
        : `${dictionaries.en.app.title} — ${dictionaries.en.app.vsLine}`;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleApi {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
