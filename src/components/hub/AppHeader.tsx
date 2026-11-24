"use client";

import Link from "next/link";
import Image from "next/image";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n/dictionaries";

const LOCALE_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

/** Shared navigation and the EN/ES language switch. */
export function AppHeader() {
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">{t.app.skipToContent}</a>
      <Link href="/" className="app-brand" prefetch={false}>
        <Image src="/hub-mark.webp" alt="" width={40} height={40} unoptimized />
        <span>{t.app.title}</span>
      </Link>
      <div className="app-header-actions">
        <Link href="/rooms" className="btn app-room-link" prefetch={false}>
          <span className="rooms-full">{t.rooms.navLink}</span><span className="rooms-short">{t.rooms.shortLink}</span>
        </Link>
        <div className="lang-switch" role="group" aria-label={t.app.language}>
          <SegPicker
            options={LOCALE_OPTIONS}
            value={locale}
            onChange={(value) => setLocale(value as Locale)}
          />
        </div>
      </div>
    </header>
  );
}
