export type Outcome = "win" | "loss" | "tie";

export interface GameScores {
  win: number;
  loss: number;
  tie: number;
}

export type AllScores = Record<string, GameScores>;
export const EMPTY_SCORES: Readonly<GameScores> = Object.freeze({ win: 0, loss: 0, tie: 0 });

function counter(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeScores(raw: unknown): AllScores {
  if (!object(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).flatMap(([id, value]) =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && object(value)
        ? [[id, { win: counter(value.win), loss: counter(value.loss), tie: counter(value.tie) }]]
        : [],
    ),
  );
}

export function migrateLegacyScores(raw: unknown): AllScores {
  if (!object(raw)) return {};
  return { guess: { win: counter(raw.player), loss: counter(raw.ai), tie: 0 } };
}

export function recordScore(scores: AllScores, gameId: string, outcome: Outcome): AllScores {
  const own = Object.prototype.hasOwnProperty.call(scores, gameId);
  const current = own ? scores[gameId] : EMPTY_SCORES;
  return {
    ...scores,
    [gameId]: { ...current, [outcome]: Math.min(Number.MAX_SAFE_INTEGER, current[outcome] + 1) },
  };
}

export function decodeScoreSnapshot(stored: string | null, legacy: string | null): AllScores {
  try {
    if (stored !== null) return sanitizeScores(JSON.parse(stored));
    return migrateLegacyScores(JSON.parse(legacy ?? "null"));
  } catch {
    return {};
  }
}
