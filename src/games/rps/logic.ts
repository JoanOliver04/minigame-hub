/**
 * Rock-Paper-Scissors — pure game rules and the AI's learning data.
 * No React, no DOM, no side effects.
 */

export type Move = "rock" | "paper" | "scissors";
export type RoundResult = "win" | "lose" | "tie"; // player's point of view
export type RpsDifficulty = "easy" | "medium" | "hard";

export const MOVES: Move[] = ["rock", "paper", "scissors"];
export const MOVE_EMOJI: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};
/** key beats value */
export const BEATS: Record<Move, Move> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};
/** value beats key — the move that counters the key */
export const COUNTER: Record<Move, Move> = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

export interface HistoryEntry {
  id: number;
  playerMove: Move;
  aiMove: Move;
  result: RoundResult;
}

type MarkovTable = Record<Move, Record<Move, number>>;

export interface MatchState {
  difficulty: RpsDifficulty;
  /** Round wins needed to take the match. */
  target: number;
  youScore: number;
  aiScore: number;
  rounds: number;
  finished: boolean;
  /** Newest first. */
  history: HistoryEntry[];
  // --- AI learning data (rebuilt every match) ---
  /** How often the player has thrown each move. */
  freq: Record<Move, number>;
  /** markov[last][next] = times the player threw `next` right after `last`. */
  markov: MarkovTable;
  lastPlayerMove: Move | null;
}

const emptyRow = (): Record<Move, number> => ({ rock: 0, paper: 0, scissors: 0 });

export function createMatch(difficulty: RpsDifficulty, target: number): MatchState {
  return {
    difficulty,
    target,
    youScore: 0,
    aiScore: 0,
    rounds: 0,
    finished: false,
    history: [],
    freq: emptyRow(),
    markov: { rock: emptyRow(), paper: emptyRow(), scissors: emptyRow() },
    lastPlayerMove: null,
  };
}

/** Standard rules, from the player's point of view. */
export function judge(playerMove: Move, aiMove: Move): RoundResult {
  if (playerMove === aiMove) return "tie";
  return BEATS[playerMove] === aiMove ? "win" : "lose";
}

/**
 * Apply one round and return the next immutable state: score it, log it,
 * and update the AI's model of the player (frequency + Markov transition).
 */
export function applyRound(state: MatchState, playerMove: Move, aiMove: Move): MatchState {
  const result = judge(playerMove, aiMove);

  const freq = { ...state.freq, [playerMove]: state.freq[playerMove] + 1 };
  const markov: MarkovTable = {
    rock: { ...state.markov.rock },
    paper: { ...state.markov.paper },
    scissors: { ...state.markov.scissors },
  };
  if (state.lastPlayerMove) markov[state.lastPlayerMove][playerMove]++;

  const youScore = state.youScore + (result === "win" ? 1 : 0);
  const aiScore = state.aiScore + (result === "lose" ? 1 : 0);
  const rounds = state.rounds + 1;

  return {
    ...state,
    youScore,
    aiScore,
    rounds,
    finished: youScore >= state.target || aiScore >= state.target,
    history: [{ id: rounds, playerMove, aiMove, result }, ...state.history],
    freq,
    markov,
    lastPlayerMove: playerMove,
  };
}
