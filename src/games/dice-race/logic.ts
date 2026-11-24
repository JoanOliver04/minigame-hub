import { otherSeat, type DuelRules, type DuelState } from "../duels/types";

export const GOAL = 30;
export type DiceMove = { kind: "bank" } | { kind: "roll"; face: number };
export interface DiceState extends DuelState {
  scores: [number, number];
  pot: number;
  lastFace: number;
  lastBank: number;
  lost: number;
}

export const roll = (): DiceMove => ({ kind: "roll", face: Math.floor(Math.random() * 6) + 1 });

export const diceRace: DuelRules<DiceState, DiceMove> = {
  id: "dice-race",
  start: () => ({ active: 0, winner: null, moves: 0, scores: [0, 0], pot: 0, lastFace: 0, lastBank: 0, lost: 0 }),
  play(state, move) {
    if (state.winner !== null) return state;
    const { active, pot } = state;
    const moves = state.moves + 1;
    if (move.kind === "bank") {
      if (!pot) return state;
      const scores: [number, number] = [...state.scores];
      scores[active] += pot;
      return { ...state, scores, pot: 0, moves, active: otherSeat(active),
        winner: scores[active] >= GOAL ? active : null, lastBank: pot, lost: 0 };
    }
    if (!Number.isInteger(move.face) || move.face < 1 || move.face > 6) return state;
    const bust = move.face === 1;
    return { ...state, active: bust ? otherSeat(active) : active, pot: bust ? 0 : pot + move.face,
      moves, lastFace: move.face, lastBank: 0, lost: bust ? pot : 0 };
  },
  choose(state, level) {
    const own = state.scores[state.active], rival = state.scores[otherSeat(state.active)];
    if (!state.pot) return roll();
    const threshold = level === "easy" ? 5 + Math.floor(Math.random() * 8) : level === "medium" ? 9 :
      Math.min(GOAL - own, Math.max(7, 11 + Math.floor((rival - own) / 2) + (rival >= 24 ? 4 : 0)));
    return own + state.pot >= GOAL || state.pot >= threshold ? { kind: "bank" } : roll();
  },
};
