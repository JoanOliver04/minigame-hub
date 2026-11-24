"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { readValue, subscribeStorage } from "@/lib/browserStorage";
import { updateBrowserRecord, useBrowserRecord } from "@/lib/browserRecords";
import { decodeScoreSnapshot, recordScore, type AllScores, type Outcome } from "@/lib/scoreStore";

export { EMPTY_SCORES } from "@/lib/scoreStore";
export type { AllScores, GameScores, Outcome } from "@/lib/scoreStore";

const STORAGE_KEY = "miniHubScores_v1";
const LEGACY_KEY = "numberDuelScores";
const emptySnapshot = () => null;

function record(gameId: string, outcome: Outcome) {
  void updateBrowserRecord(STORAGE_KEY, (raw) => {
    const scores = decodeScoreSnapshot(raw, raw === null ? readValue(LEGACY_KEY) : null);
    return JSON.stringify(recordScore(scores, gameId, outcome));
  });
}

interface ScoresApi {
  scores: AllScores;
  record: typeof record;
}
const ScoresContext = createContext<ScoresApi | null>(null);

export function ScoresProvider({ children }: { children: ReactNode }) {
  const stored = useBrowserRecord(STORAGE_KEY);
  const legacy = useSyncExternalStore(subscribeStorage, () => stored === null ? readValue(LEGACY_KEY) : null, emptySnapshot);
  const scores = useMemo(() => decodeScoreSnapshot(stored, legacy), [stored, legacy]);
  return <ScoresContext.Provider value={{ scores, record }}>{children}</ScoresContext.Provider>;
}

export function useScores(): ScoresApi {
  const ctx = useContext(ScoresContext);
  if (!ctx) throw new Error("useScores must be used inside <ScoresProvider>");
  return ctx;
}
