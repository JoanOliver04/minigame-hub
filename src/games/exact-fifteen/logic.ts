import { createRng, randomSeed } from "@/lib/rng";
import { otherSeat, type DuelRules, type DuelState } from "../duels/types";

export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const triples = NUMBERS.flatMap(a => NUMBERS.flatMap(b => {
  const c = 15 - a - b;
  return a < b && b < c && c <= 9 ? [[a, b, c]] : [];
}));

export interface FifteenState extends DuelState {
  // Indexed by number minus one, zero for unclaimed, otherwise seat plus one.
  owners: number[];
  last: number;
}

export function winningTrio(owners: number[], player: number) {
  return triples.find(group => group.every(n => owners[n - 1] === player + 1));
}

function claim(state: FifteenState, n: number): FifteenState {
  if (state.winner !== null || !NUMBERS.includes(n) || state.owners[n - 1]) return state;
  const owners = [...state.owners];
  owners[n - 1] = state.active + 1;
  const moves = state.moves + 1;
  return { owners, moves, last: n, active: otherSeat(state.active),
    winner: winningTrio(owners, state.active) ? state.active : moves === 9 ? "tie" : null };
}

function value(state: FifteenState, depth: number, memo: Map<string, number>): number {
  if (state.winner === "tie") return 0;
  if (state.winner !== null) return state.moves - 20;
  if (depth === 0) {
    const potential = (seat: number) => triples.filter(trio =>
      trio.every(n => state.owners[n - 1] !== 2 - seat) && trio.some(n => state.owners[n - 1] === seat + 1)).length;
    return potential(state.active) - potential(otherSeat(state.active));
  }
  const key = state.owners.join("");
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const free = NUMBERS.filter(n => !state.owners[n - 1]);
  const best = Math.max(...free.map(n => -value(claim(state, n), depth - 1, memo)));
  memo.set(key, best);
  return best;
}

export const fifteen: DuelRules<FifteenState, number> = {
  id: "exact-fifteen",
  start: () => ({ owners: Array(9).fill(0), active: 0, winner: null, moves: 0, last: 0 }),
  play: claim,
  choose(state, level) {
    const free = NUMBERS.filter(n => !state.owners[n - 1]);
    const rng = createRng(randomSeed());
    if (level === "easy") return rng.pick(free);
    const memo = new Map<string, number>();
    const scores = free.map(n => -value(claim(state, n), level === "hard" ? free.length - 1 : 1, memo));
    const best = Math.max(...scores);
    return rng.pick(free.filter((_, i) => scores[i] === best));
  },
};
