"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import { useStoredPreference } from "@/lib/useStoredPreference";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "miniHubLocale_v1";

interface LocaleApi {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleApi | null>(null);

function parseLocale(value: string | null): Locale | null {
  if (value === "en" || value === "es") return value;
  for (const language of navigator.languages) {
    const base = language.toLowerCase().split("-")[0];
    if (base === "en" || base === "es") return base;
  }
  return null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useStoredPreference<Locale>(STORAGE_KEY, "en", parseLocale);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
    const t = dictionaries[locale];
    const section = pathname.startsWith("/games/") ? t.gamesMeta[pathname.slice(7)]?.name
      : pathname === "/daily" ? t.daily.title
      : pathname === "/favorites" ? t.hub.favorites
      : pathname === "/scores" ? t.hub.scoreboard
      : pathname.startsWith("/rooms") ? t.rooms.navLink : null;
    document.title = section ? section + " | " + t.app.title : t.app.title + " — " + t.app.vsLine;
  }, [locale, pathname]);

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
