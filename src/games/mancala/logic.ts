import { otherSeat, type DuelRules, type DuelState, type Seat } from "../duels/types";

export const storeOf = (seat: Seat) => seat * 7 + 6;
export const pitsOf = (seat: Seat) => Array.from({ length: 6 }, (_, i) => seat * 7 + i);

export interface MancalaState extends DuelState {
  cups: number[];
  from: number;
  landed: number;
  captured: number;
  again: boolean;
}

function sow(state: MancalaState, pit: number): MancalaState {
  const { active } = state;
  const rival = otherSeat(active), store = storeOf(active);
  if (state.winner !== null || !Number.isInteger(pit) || pit < store - 6 || pit >= store || !state.cups[pit]) return state;
  const cups = [...state.cups];
  let seeds = cups[pit], landed = pit;
  cups[pit] = 0;
  while (seeds > 0) {
    landed = (landed + 1) % 14;
    if (landed === storeOf(rival)) continue;
    cups[landed]++;
    seeds--;
  }
  const opposite = 12 - landed;
  let captured = 0;
  if (landed >= store - 6 && landed < store && cups[landed] === 1 && cups[opposite] > 0) {
    captured = 1 + cups[opposite];
    cups[store] += captured;
    cups[landed] = cups[opposite] = 0;
  }
  const finished = [active, rival].some(seat => pitsOf(seat).every(i => cups[i] === 0));
  if (finished) {
    for (const seat of [active, rival]) {
      for (const i of pitsOf(seat)) {
        cups[storeOf(seat)] += cups[i];
        cups[i] = 0;
      }
    }
  }
  const again = !finished && landed === store;
  return { cups, from: pit, landed, captured, again, active: again ? active : rival, moves: state.moves + 1,
    winner: finished ? (cups[6] === cups[13] ? "tie" : cups[6] > cups[13] ? 0 : 1) : null };
}

function evaluate(state: MancalaState, seat: Seat) {
  const rival = otherSeat(seat);
  const lead = state.cups[storeOf(seat)] - state.cups[storeOf(rival)];
  if (state.winner !== null) return Math.sign(lead) * 1000 + lead;
  const mobility = (side: Seat) => pitsOf(side).filter(i => state.cups[i] > 0).length;
  return lead * 5 + mobility(seat) - mobility(rival);
}

function search(state: MancalaState, seat: Seat, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || state.winner !== null) return evaluate(state, seat);
  const maximizing = state.active === seat;
  let best = maximizing ? -Infinity : Infinity;
  for (const pit of pitsOf(state.active)) {
    if (!state.cups[pit]) continue;
    const score = search(sow(state, pit), seat, depth - 1, alpha, beta);
    if (maximizing) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
    else { best = Math.min(best, score); beta = Math.min(beta, best); }
    if (alpha >= beta) break;
  }
  return best;
}

export const mancala: DuelRules<MancalaState, number> = {
  id: "mancala",
  start: () => ({ active: 0, winner: null, moves: 0, cups: Array.from({ length: 14 }, (_, i) => i % 7 === 6 ? 0 : 4),
    from: -1, landed: -1, captured: 0, again: false }),
  play: sow,
  choose(state, level) {
    const options = pitsOf(state.active).filter(pit => state.cups[pit] > 0);
    if (level === "easy") return options[Math.floor(Math.random() * options.length)];
    const depth = level === "hard" ? 5 : 2;
    const scores = options.map(pit => search(sow(state, pit), state.active, depth, -Infinity, Infinity));
    const best = Math.max(...scores);
    const finalists = options.filter((_, i) => scores[i] === best);
    return finalists[Math.floor(Math.random() * finalists.length)];
  },
};
