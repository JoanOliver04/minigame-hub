"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { readValue, subscribeStorage } from "@/lib/browserStorage";
import { useLocale } from "@/context/LocaleContext";

/** Small "back to hub" link shown at the top of every game screen. */
export function BackLink() {
  const { t } = useLocale();
  const pathname = usePathname();
  const favoriteOrigin = useSyncExternalStore(subscribeStorage, () => readValue("miniHubFavoriteOrigin", "session"), () => null);
  const fromFavorites = favoriteOrigin !== null && pathname === favoriteOrigin;
  return (
    <Link href={fromFavorites ? "/favorites" : "/"} className="back-link">
      {fromFavorites ? `← ${t.hub.favorites}` : t.common.backLink}
    </Link>
  );
}
