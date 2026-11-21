/**
 * Rock-Paper-Scissors — AI opponent.
 *
 *  - easy:   uniform random.
 *  - medium: 70% of the time, counter the player's most frequent move so
 *            far; otherwise random. (Slight lean, still beatable.)
 *  - hard:   combines overall and recent frequency, one-step transitions,
 *            and repeated two-move patterns, with a small random component
 *            so the predictor itself is not trivially exploitable.
 *
 * Fairness: the AI only ever reads data from PREVIOUS rounds — the hook
 * calls aiPickMove() before this round's player move is learned.
 */

import { BEATS, COUNTER, MOVES, type MatchState, type Move } from "./logic";

function pick(moves: Move[], random: () => number): Move {
  return moves[Math.floor(random() * moves.length)];
}

function mostFrequentMove(freq: Record<Move, number>): Move | null {
  if (freq.rock + freq.paper + freq.scissors === 0) return null;
  let fav: Move = "rock";
  let best = -1;
  for (const m of MOVES) {
    if (freq[m] > best) {
      best = freq[m];
      fav = m;
    }
  }
  return fav;
}

function addScores(target: Record<Move, number>, source: Record<Move, number>, weight: number) {
  const total = MOVES.reduce((sum, move) => sum + source[move], 0);
  if (total === 0) return;
  for (const move of MOVES) target[move] += (source[move] / total) * weight;
}

function estimatePlayer(state: MatchState): Record<Move, number> {
  const scores: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
  addScores(scores, state.freq, 1);

  if (state.lastPlayerMove) addScores(scores, state.markov[state.lastPlayerMove], 2.2);

  // Recent moves matter more when the player changes strategy mid-match.
  state.history.slice(0, 6).forEach((entry, index) => {
    scores[entry.playerMove] += (6 - index) * 0.12;
  });

  // Detect a repeated two-move context (e.g. rock, paper, scissors cycles).
  const chronological = state.history.slice(0, 24).reverse().map((entry) => entry.playerMove);
  if (chronological.length >= 4) {
    const a = chronological.at(-2);
    const b = chronological.at(-1);
    for (let i = 0; i < chronological.length - 2; i++) {
      if (chronological[i] === a && chronological[i + 1] === b) {
        scores[chronological[i + 2]] += 3;
      }
    }
  }

  // A player may repeat a winning move or react to a loss. Give this
  // context extra weight only when it has appeared before.
  const last = state.history[0];
  if (last) {
    for (let i = 1; i < Math.min(25, state.history.length); i++) {
      const prior = state.history[i];
      if (prior.result !== last.result) continue;
      const weight = prior.aiMove === last.aiMove ? 1.6 : 0.55;
      scores[state.history[i - 1].playerMove] += weight / (1 + i * 0.12);
    }
  }
  return scores;
}

export function aiPickMove(state: MatchState, random = Math.random): Move {
  if (state.difficulty === "easy") return pick(MOVES, random);

  if (state.difficulty === "medium") {
    const fav = mostFrequentMove(state.freq);
    if (fav && random() < 0.7) return COUNTER[fav];
    return pick(MOVES, random);
  }

  if (!state.history.length || random() < 0.08) return pick(MOVES, random);
  const scores = estimatePlayer(state);
  const utility = (move: Move) => scores[BEATS[move]] - scores[COUNTER[move]];
  const best = Math.max(...MOVES.map(utility));
  return pick(MOVES.filter((move) => Math.abs(utility(move) - best) < 1e-9), random);
}
