import { createRng, randomSeed } from "@/lib/rng";
import { otherSeat, type DuelRules, type DuelState, type Seat } from "../duels/types";

export const WIDTH = 5;
const cells = Array.from({ length: WIDTH * WIDTH }, (_, i) => i);
const neighbors = cells.map(from => cells.filter(to => to !== from &&
  Math.abs(from % WIDTH - to % WIDTH) <= 1 &&
  Math.abs(Math.floor(from / WIDTH) - Math.floor(to / WIDTH)) <= 1));

export interface IceState extends DuelState {
  pawns: [number, number];
  water: number;
  lastSunk: number;
}

export function iceOpening(seed = randomSeed()): IceState {
  const hole = createRng(seed).pick([1, 2, 3, 6, 7, 8]);
  return { active: 0, winner: null, moves: 0, pawns: [10, 14],
    water: (1 << hole) | (1 << (24 - hole)), lastSunk: -1 };
}

export function jumps(state: IceState, seat: Seat) {
  const blocked = state.water | (1 << state.pawns[otherSeat(seat)]);
  return neighbors[state.pawns[seat]].filter(to => !(blocked & (1 << to)));
}

function jump(state: IceState, to: number): IceState {
  const seat = state.active;
  if (state.winner !== null || !jumps(state, seat).includes(to)) return state;
  const from = state.pawns[seat], pawns: [number, number] = [...state.pawns];
  pawns[seat] = to;
  const next = { ...state, moves: state.moves + 1, active: otherSeat(seat), pawns,
    lastSunk: from, water: state.water | (1 << from) };
  if (jumps(next, next.active).length === 0) next.winner = seat;
  return next;
}

// Count reachable ice on each side of a cut, treating the other pawn as occupied.
function territory(state: IceState, seat: Seat) {
  const queue = [state.pawns[seat]];
  let seen = state.water | (1 << queue[0]) | (1 << state.pawns[otherSeat(seat)]);
  for (let i = 0; i < queue.length; i++) {
    for (const to of neighbors[queue[i]]) {
      if (!(seen & (1 << to))) {
        seen |= 1 << to;
        queue.push(to);
      }
    }
  }
  return queue.length;
}

function value(state: IceState, depth: number, alpha: number, beta: number): number {
  // A terminal state has already switched to the player who is trapped.
  if (state.winner !== null) return -1000 + state.moves;
  const seat = state.active, rival = otherSeat(seat);
  const options = jumps(state, seat);
  if (depth === 0) {
    return 2 * (territory(state, seat) - territory(state, rival)) + options.length - jumps(state, rival).length;
  }
  let best = -Infinity;
  for (const to of options) {
    best = Math.max(best, -value(jump(state, to), depth - 1, -beta, -Math.max(alpha, best)));
    if (best >= beta) break;
  }
  return best;
}

export const ice: DuelRules<IceState, number> = {
  id: "ice-floe", start: iceOpening, play: jump,
  choose(state, level) {
    const options = jumps(state, state.active);
    const rng = createRng(randomSeed());
    if (level === "easy") return rng.pick(options);
    const scores = options.map(to => -value(jump(state, to), level === "hard" ? 4 : 1, -Infinity, Infinity));
    const best = Math.max(...scores);
    return rng.pick(options.filter((_, i) => scores[i] === best));
  },
};
