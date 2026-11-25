import type { DuelId, DuelRules, DuelState, Level } from "./types";

export const duelSaveKey = (game: DuelId) => "miniHubSoloDuel_v1:" + game;

export interface SavedDuel<A> {
  id: string;
  seed: number;
  level: Level;
  actions: A[];
  finished: boolean;
  updatedAt: number;
}

export function readDuelHeader(raw: string | null): SavedDuel<unknown> | null {
  if (!raw) return null;
  try {
    const save = JSON.parse(raw);
    if (typeof save?.id !== "string" || !save.id || !Number.isInteger(save.seed) || save.seed < 0 || save.seed > 0xffffffff ||
      !["easy", "medium", "hard"].includes(save.level) || !Array.isArray(save.actions) ||
      typeof save.finished !== "boolean" || !Number.isSafeInteger(save.updatedAt)) return null;
    return save;
  } catch {
    return null;
  }
}

// Rebuild from the original opening and accepted moves, including the actual dice rolls and AI choices.
export function restoreDuel<S extends DuelState, A>(rules: DuelRules<S, A>, raw: string | null) {
  const header = readDuelHeader(raw);
  if (!header) return null;
  const save = header as SavedDuel<A>;
  const frames = [rules.start(save.seed)];
  try {
    for (const action of save.actions) {
      const before = frames[frames.length - 1];
      const next = rules.play(before, action);
      if (next === before || before.winner !== null) return null;
      frames.push(next);
    }
  } catch {
    return null;
  }
  const state = frames[frames.length - 1];
  return (state.winner !== null) === save.finished ? { save, frames, state } : null;
}
