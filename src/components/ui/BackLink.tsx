"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

/** Small "back to hub" link shown at the top of every game screen. */
export function BackLink() {
  const { t } = useLocale();
  return (
    <Link href="/" className="back-link">
      {t.common.backLink}
    </Link>
  );
}
