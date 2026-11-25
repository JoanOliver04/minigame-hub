"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { isSoundEnabled, setSoundEnabled, subscribeSound } from "@/lib/sound";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n/dictionaries";
import { InstallApp } from "./InstallApp";
import { getGame } from "@/games/registry";

const LOCALE_OPTIONS = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

function subscribeConnection(notify: () => void) {
  const reconnected = () => {
    document.documentElement.removeAttribute("data-offline-edition");
    notify();
  };
  window.addEventListener("online", reconnected);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", reconnected);
    window.removeEventListener("offline", notify);
  };
}

/** Shared navigation and the EN/ES language switch. */
export function AppHeader() {
  const { locale, setLocale, t } = useLocale();
  const path = usePathname();
  const game = path.startsWith("/games/") ? getGame(path.slice("/games/".length)) : undefined;
  const friendsHref = game?.supportsMultiplayer ? `/rooms?game=${game.id}` : "/rooms";
  const sound = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);
  const online = useSyncExternalStore(subscribeConnection,
    () => navigator.onLine && !document.documentElement.hasAttribute("data-offline-edition"), () => true);

  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">{t.app.skipToContent}</a>
      <Link href="/" className="app-brand" prefetch={false}>
        <Image src="/hub-mark.webp" alt="" width={40} height={40} unoptimized />
        <span>{t.app.title}</span>
      </Link>
      <div className="app-header-actions">
        <Link href={friendsHref} className="btn friends-link" prefetch={false}
          aria-label={t.rooms.navLink} aria-describedby="friends-link-purpose">
          <span aria-hidden="true">👥</span>
          <span className="friends-link-copy">{t.rooms.navLink}
            <small id="friends-link-purpose">{t.rooms.navHint}</small>
          </span>
        </Link>
        <InstallApp />
        <button type="button" className="btn hub-sound" aria-label={t.play.gameSound}
          title={t.play.gameSound} aria-pressed={sound} onClick={() => setSoundEnabled(!sound)}>
          <span aria-hidden="true">{sound ? "🔊" : "🔇"}</span>
        </button>
        <div className="lang-switch" role="group" aria-label={t.app.language}>
          <SegPicker
            options={LOCALE_OPTIONS}
            value={locale}
            onChange={(value) => setLocale(value as Locale)}
          />
        </div>
      </div>
      {!online && <div className="offline-status" role="status">{t.app.offline}</div>}
    </header>
  );
}
