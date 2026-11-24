"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { isSoundEnabled, setSoundEnabled, subscribeSound } from "@/lib/sound";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n/dictionaries";
import { InstallApp } from "./InstallApp";

const LOCALE_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

/** Shared navigation and the EN/ES language switch. */
export function AppHeader() {
  const { locale, setLocale, t } = useLocale();
  const sound = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);

  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">{t.app.skipToContent}</a>
      <Link href="/" className="app-brand" prefetch={false}>
        <Image src="/hub-mark.webp" alt="" width={40} height={40} unoptimized />
        <span>{t.app.title}</span>
      </Link>
      <div className="app-header-actions">
        <InstallApp />
        <button type="button" className="btn hub-sound" aria-label={t.play.gameSound}
          title={t.play.gameSound} aria-pressed={sound} onClick={() => setSoundEnabled(!sound)}>
          <span aria-hidden="true">{sound ? "🔊" : "🔇"}</span>
        </button>
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
