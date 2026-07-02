"use client";

/**
 * Global language switch: English/Spanish, persisted in localStorage.
 * Same one-shot post-hydration load pattern as ScoresContext — reading
 * localStorage during the initializer would diverge from the server-
 * rendered default and cause a hydration mismatch.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "miniHubLocale_v1";

interface LocaleApi {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleApi | null>(null);

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (isLocale(raw)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocale(raw);
      }
    } catch {
      /* corrupt or blocked storage — start with default */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "es"
        ? `${dictionaries.es.app.title} — ${dictionaries.es.app.vsLine}`
        : `${dictionaries.en.app.title} — ${dictionaries.en.app.vsLine}`;
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage blocked — ignore */
    }
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
