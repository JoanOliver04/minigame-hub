"use client";

/**
 * Global score store: per-game win/loss/tie tallies persisted in
 * localStorage. Game modules call `record(gameId, outcome)`; the hub
 * renders per-game rows plus a combined overall total.
 *
 * Generic on purpose — it never imports the game registry, so adding a
 * new mini-game requires no changes here (a missing entry reads as 0s).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { mergeScores, migrateLegacyScores, recordScore, sanitizeScores, type AllScores, type Outcome } from "@/lib/scoreStore";

export { EMPTY_SCORES } from "@/lib/scoreStore";
export type { AllScores, GameScores, Outcome } from "@/lib/scoreStore";

const STORAGE_KEY = "miniHubScores_v1";
const LEGACY_KEY = "numberDuelScores"; // original single-game app

interface ScoresApi {
  scores: AllScores;
  record: (gameId: string, outcome: Outcome) => void;
}

const ScoresContext = createContext<ScoresApi | null>(null);

function loadScores(): AllScores {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return sanitizeScores(JSON.parse(stored));
    const legacy = localStorage.getItem(LEGACY_KEY);
    return legacy === null ? {} : migrateLegacyScores(JSON.parse(legacy));
  } catch {
    return {};
  }
}

export function ScoresProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ scores: AllScores; ready: boolean }>({
    scores: {},
    ready: false,
  });

  useEffect(() => {
    const saved = loadScores();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
    setState((current) => current.ready ? current : { scores: mergeScores(saved, current.scores), ready: true });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scores));
    } catch {
      /* storage blocked — ignore */
    }
  }, [state]);

  const record = useCallback((gameId: string, outcome: Outcome) => {
    setState((current) => ({ ...current, scores: recordScore(current.scores, gameId, outcome) }));
  }, []);

  return (
    <ScoresContext.Provider value={{ scores: state.scores, record }}>
      {children}
    </ScoresContext.Provider>
  );
}

export function useScores(): ScoresApi {
  const ctx = useContext(ScoresContext);
  if (!ctx) throw new Error("useScores must be used inside <ScoresProvider>");
  return ctx;
}
