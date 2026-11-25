"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { duelSaveKey, readDuelHeader } from "@/games/duels/savedDuel";
import { DUEL_IDS } from "@/games/duels/types";
import { freePuzzleKey, readFreeRun } from "@/games/sliding-puzzle/savedPuzzle";
import { getGame } from "@/games/registry";
import { readValue, subscribeValue, writeValue } from "@/lib/browserStorage";
import { readBrowserRecord, subscribeBrowserRecord } from "@/lib/browserRecords";

function subscribeSaved(notify: () => void) {
  const subscriptions = DUEL_IDS.map(id => subscribeBrowserRecord(duelSaveKey(id), notify));
  subscriptions.push(subscribeValue(freePuzzleKey, notify));
  return () => subscriptions.forEach(unsubscribe => unsubscribe());
}

function savedIds() {
  const runs = DUEL_IDS.flatMap(id => {
    const save = readDuelHeader(readBrowserRecord(duelSaveKey(id)));
    return save && !save.finished ? [{ id, updatedAt: save.updatedAt }] : [];
  });
  const ids: string[] = runs.sort((a, b) => b.updatedAt - a.updatedAt).map(run => run.id);
  if (readFreeRun(readValue(freePuzzleKey))) ids.push("sliding-puzzle");
  return ids.join(",");
}

export function SavedGames() {
  const { t } = useLocale();
  const ids = useSyncExternalStore(subscribeSaved, savedIds, () => "");
  if (!ids) return null;
  return <section className="hub-saved" aria-labelledby="saved-title">
    <h2 id="saved-title">{t.hub.continuePlaying}</h2>
    <ul>{ids.split(",").map(id => <li key={id}>
      <Link href={`/games/${id}${id === "sliding-puzzle" ? "#resume" : ""}`} prefetch={false}
        onNavigate={() => writeValue("miniHubFavoriteOrigin", null, "session")}>
        <span aria-hidden="true">{getGame(id)?.icon}</span> {t.gamesMeta[id].name}<span aria-hidden="true"> →</span>
      </Link>
    </li>)}</ul>
  </section>;
}
