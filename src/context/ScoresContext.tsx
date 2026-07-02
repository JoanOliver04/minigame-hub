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
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Outcome = "win" | "loss" | "tie";

export interface GameScores {
  win: number;
  loss: number;
  tie: number;
}

export type AllScores = Record<string, GameScores>;

export const EMPTY_SCORES: GameScores = { win: 0, loss: 0, tie: 0 };

const STORAGE_KEY = "miniHubScores_v1";
const LEGACY_KEY = "numberDuelScores"; // original single-game app

interface ScoresApi {
  scores: AllScores;
  record: (gameId: string, outcome: Outcome) => void;
}

const ScoresContext = createContext<ScoresApi | null>(null);

/** Keep only well-formed integer tallies from whatever was stored. */
function sanitize(raw: unknown): AllScores {
  const out: AllScores = {};
  if (raw && typeof raw === "object") {
    for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
      if (val && typeof val === "object") {
        const v = val as Record<string, unknown>;
        out[id] = {
          win: Number.isInteger(v.win) ? (v.win as number) : 0,
          loss: Number.isInteger(v.loss) ? (v.loss as number) : 0,
          tie: Number.isInteger(v.tie) ? (v.tie as number) : 0,
        };
      }
    }
  }
  return out;
}

export function ScoresProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<AllScores>({});
  const loaded = useRef(false);

  // Load once on the client. localStorage cannot be read in the useState
  // initializer: it runs during SSR/prerender too, and diverging from the
  // server-rendered zeros would cause a hydration mismatch. A one-shot
  // post-hydration setState is the intended pattern here.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScores(sanitize(JSON.parse(raw)));
      } else {
        // One-time migration from the original standalone scoreboard
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const old = JSON.parse(legacy) as { player?: number; ai?: number };
          setScores({
            guess: {
              win: Number.isInteger(old.player) ? old.player! : 0,
              loss: Number.isInteger(old.ai) ? old.ai! : 0,
              tie: 0,
            },
          });
        }
      }
    } catch {
      /* corrupt or blocked storage — start fresh */
    }
    loaded.current = true;
  }, []);

  // Persist on every change (after the initial load).
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {
      /* storage blocked — ignore */
    }
  }, [scores]);

  const record = useCallback((gameId: string, outcome: Outcome) => {
    setScores((prev) => {
      const current = prev[gameId] ?? EMPTY_SCORES;
      return { ...prev, [gameId]: { ...current, [outcome]: current[outcome] + 1 } };
    });
  }, []);

  return (
    <ScoresContext.Provider value={{ scores, record }}>
      {children}
    </ScoresContext.Provider>
  );
}

export function useScores(): ScoresApi {
  const ctx = useContext(ScoresContext);
  if (!ctx) throw new Error("useScores must be used inside <ScoresProvider>");
  return ctx;
}
