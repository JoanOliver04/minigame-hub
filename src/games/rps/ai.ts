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

import { randomInt } from "@/lib/random";
import { COUNTER, MOVES, type MatchState, type Move } from "./logic";

function randomMove(): Move {
  return MOVES[randomInt(0, 2)];
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

function predictPlayer(state: MatchState): Move | null {
  const scores: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
  addScores(scores, state.freq, 1);

  if (state.lastPlayerMove) addScores(scores, state.markov[state.lastPlayerMove], 2.2);

  // Recent moves matter more when the player changes strategy mid-match.
  state.history.slice(0, 6).forEach((entry, index) => {
    scores[entry.playerMove] += (6 - index) * 0.12;
  });

  // Detect a repeated two-move context (e.g. rock, paper, scissors cycles).
  const chronological = [...state.history].reverse().map((entry) => entry.playerMove);
  if (chronological.length >= 4) {
    const a = chronological.at(-2);
    const b = chronological.at(-1);
    for (let i = 0; i < chronological.length - 2; i++) {
      if (chronological[i] === a && chronological[i + 1] === b) {
        scores[chronological[i + 2]] += 3;
      }
    }
  }

  const total = MOVES.reduce((sum, move) => sum + scores[move], 0);
  if (total === 0) return null;
  return MOVES.reduce((best, move) => (scores[move] > scores[best] ? move : best));
}

export function aiPickMove(state: MatchState): Move {
  if (state.difficulty === "easy") return randomMove();

  if (state.difficulty === "medium") {
    const fav = mostFrequentMove(state.freq);
    if (fav && Math.random() < 0.7) return COUNTER[fav];
    return randomMove();
  }

  const predicted = predictPlayer(state);
  // Small random component prevents the predictor itself becoming a simple,
  // exploitable pattern when evidence is tied or the player adapts.
  if (!predicted || Math.random() < 0.08) return randomMove();
  return COUNTER[predicted];
}
