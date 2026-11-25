"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { readValue, subscribeValue } from "@/lib/browserStorage";
import { forgetRoom, parseRecentRoom, recentRoomKey } from "@/lib/rooms/recentRoom";

const subscribe = (notify: () => void) => subscribeValue(recentRoomKey, notify);
const snapshot = () => {
  const raw = readValue(recentRoomKey);
  const saved = parseRecentRoom(raw);
  return saved && saved.expiresAt > Date.now() ? raw : null;
};

export function RecentRoomLink({ currentPath, onClick, className }: {
  currentPath?: string; onClick?: () => void; className?: string;
}) {
  const { t } = useLocale();
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const room = parseRecentRoom(raw);
  useEffect(() => {
    const saved = parseRecentRoom(raw);
    if (!saved) return;
    const timer = window.setTimeout(() => {
      if (readValue(recentRoomKey) === raw) forgetRoom(saved.code);
    }, Math.max(0, saved.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [raw]);
  if (!room) return null;
  const href = "/rooms/" + room.code;
  if (currentPath?.toUpperCase() === href.toUpperCase()) return null;
  return <Link href={href} prefetch={false} className={className} onClick={onClick}>
    {t.rooms.returnToRoom(t.gamesMeta[room.gameId].name)}
  </Link>;
}
