"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { localKeysWithPrefix, readValue, subscribeStorage, writeValue } from "@/lib/browserStorage";
import { updateBrowserRecord, useBrowserRecord } from "@/lib/browserRecords";
import { decodeScoreSnapshot, recordScore, type AllScores, type Outcome } from "@/lib/scoreStore";

export { EMPTY_SCORES } from "@/lib/scoreStore";
export type { AllScores, GameScores, Outcome } from "@/lib/scoreStore";

const STORAGE_KEY = "miniHubScores_v1";
const LEGACY_KEY = "numberDuelScores";
const pendingPrefix = "miniHubPendingScore:";
const inFlight = new Set<string>();
const emptySnapshot = () => null;

async function applyPending(key: string) {
  if (inFlight.has(key)) return;
  const entry = readValue(key);
  if (!entry) return;
  const [gameId, outcome] = entry.split("/");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameId) || (outcome !== "win" && outcome !== "loss" && outcome !== "tie")) {
    writeValue(key, null);
    return;
  }
  inFlight.add(key);
  try {
    await updateBrowserRecord(STORAGE_KEY, (raw) => {
      const scores = decodeScoreSnapshot(raw, raw === null ? readValue(LEGACY_KEY) : null);
      return JSON.stringify(recordScore(scores, gameId, outcome));
    }, key);
  } finally {
    inFlight.delete(key);
  }
}

function record(gameId: string, outcome: Outcome) {
  // Persist the individual result synchronously, before navigation can cancel IndexedDB.
  const key = pendingPrefix + crypto.getRandomValues(new Uint32Array(4)).join("-");
  writeValue(key, gameId + "/" + outcome);
  void applyPending(key);
}

interface ScoresApi {
  scores: AllScores;
  record: typeof record;
}
const ScoresContext = createContext<ScoresApi | null>(null);

export function ScoresProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const recover = () => localKeysWithPrefix(pendingPrefix).forEach(key => void applyPending(key));
    recover();
    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith(pendingPrefix) && event.newValue) void applyPending(event.key);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", recover);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", recover);
    };
  }, []);
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
