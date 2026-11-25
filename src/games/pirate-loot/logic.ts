import { createRng, randomSeed } from "@/lib/rng";
import { otherSeat, type DuelRules, type DuelState } from "../duels/types";

export type Prize = number | "key" | "chest";
const cargo: Prize[] = [2, 3, 4, 5, 6, 7, "key", "key", "key", "chest", "chest", "chest"];

export interface LootState extends DuelState {
  deck: Prize[];
  left: number;
  right: number;
  gold: [number, number];
  keys: [number, number];
  last: number;
  gain: number;
}

export function lootOpening(seed = randomSeed()): LootState {
  return { active: 0, winner: null, moves: 0, deck: createRng(seed).shuffle(cargo),
    left: 0, right: cargo.length - 1, gold: [0, 0], keys: [0, 0], last: -1, gain: 0 };
}

export function price(prize: Prize, keys: number) {
  if (prize === "chest") return keys > 0 ? 10 : 2;
  return prize === "key" ? 1 : prize;
}

function take(state: LootState, index: number): LootState {
  if (state.winner !== null || (index !== state.left && index !== state.right)) return state;
  const seat = state.active, prize = state.deck[index];
  const gold: [number, number] = [...state.gold], keys: [number, number] = [...state.keys];
  const gain = price(prize, keys[seat]);
  gold[seat] += gain;
  if (prize === "key") keys[seat]++;
  if (prize === "chest" && keys[seat] > 0) keys[seat]--;
  const left = state.left + Number(index === state.left);
  const right = state.right - Number(index !== state.left);
  return { ...state, left, right, gold, keys, gain, last: index, active: otherSeat(seat), moves: state.moves + 1,
    winner: left <= right ? null : gold[0] === gold[1] ? "tie" : gold[0] > gold[1] ? 0 : 1 };
}

function ends(state: LootState) {
  return state.left === state.right ? [state.left] : [state.left, state.right];
}

function advantage(state: LootState, depth: number): number {
  const seat = state.active, rival = otherSeat(seat);
  const lead = state.gold[seat] - state.gold[rival];
  if (state.winner !== null) return lead;
  if (depth === 0) {
    const chests = state.deck.slice(state.left, state.right + 1).filter(prize => prize === "chest").length;
    return lead + 3 * (Math.min(state.keys[seat], chests) - Math.min(state.keys[rival], chests));
  }
  return Math.max(...ends(state).map(i => -advantage(take(state, i), depth - 1)));
}

export const loot: DuelRules<LootState, number> = {
  id: "pirate-loot", start: lootOpening, play: take,
  choose(state, level) {
    const options = ends(state), rng = createRng(randomSeed());
    if (level === "easy" || options.length === 1) return rng.pick(options);
    const depth = level === "hard" ? state.right - state.left : 2;
    const scores = options.map(i => -advantage(take(state, i), depth));
    return rng.pick(options.filter((_, i) => scores[i] === Math.max(...scores)));
  },
};
