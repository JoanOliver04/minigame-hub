/**
 * Blackjack — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/hints.ts, not a replacement: solo mode is player-vs-a
 * fixed-rule dealer. PvP drops the dealer and is a straight 21 duel between
 * the two seats: closest to 21 without busting wins the round. It reuses the
 * pure `calculateHandValue` (Ace-aware totals) and the shared deck primitives;
 * only the uid-keyed turn/hand bookkeeping is new.
 *
 * Turn-based (carries a `turn` field → firestore.rules' turn guard applies).
 * The round starter plays hit/stand until they stand or bust, then the
 * opponent does, then the round resolves. Deck/hands are flat card arrays
 * (Firestore-safe). Both hands are fully visible — there's no hidden hole card
 * in the PvP variant.
 */

"use client";

import { createStandardDeck, shuffleDeck, type Card } from "@/lib/cards";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { calculateHandValue } from "./logic";

export const BLACKJACK_ROOM_TARGET = 3;

export interface BlackjackRoomGame {
  target: number;
  deck: Card[];
  hands: Record<string, Card[]>;
  /** Whether each seat has finished acting (stood or busted) this round. */
  stood: Record<string, boolean>;
  /** uid to act now; `null` once the match is finished. */
  turn: string | null;
  /** Play order for the current round: [starter, opponent]. */
  order: string[];
  scores: Record<string, number>;
  pushes: number;
  rounds: number;
  finished: boolean;
  starterUid: string;
  lastOutcome: {
    winnerUid: string | null;
    totals: Record<string, number>;
    busts: Record<string, boolean>;
  } | null;
}

interface DealtRound {
  deck: Card[];
  hands: Record<string, Card[]>;
}

function deal(order: string[]): DealtRound {
  const deck = shuffleDeck(createStandardDeck());
  const hands: Record<string, Card[]> = {};
  for (const uid of order) hands[uid] = [deck.pop()!, deck.pop()!];
  return { deck, hands };
}

function freshRound(order: string[], base: Omit<BlackjackRoomGame, "deck" | "hands" | "stood" | "turn" | "order">): BlackjackRoomGame {
  const { deck, hands } = deal(order);
  return {
    ...base,
    deck,
    hands,
    stood: Object.fromEntries(order.map((uid) => [uid, false])),
    turn: order[0],
    order,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedBlackjackRoomGame. */
export function createInitialBlackjackRoomGame(): BlackjackRoomGame {
  return {
    target: BLACKJACK_ROOM_TARGET,
    deck: [],
    hands: {},
    stood: {},
    turn: null,
    order: [],
    scores: {},
    pushes: 0,
    rounds: 0,
    finished: false,
    starterUid: "",
    lastOutcome: null,
  };
}

/** Real seed, once both uids are known. Host starts the first round. */
export function seedBlackjackRoomGame(
  _hostGame: BlackjackRoomGame,
  hostUid: string,
  guestUid: string,
): BlackjackRoomGame {
  return freshRound([hostUid, guestUid], {
    target: BLACKJACK_ROOM_TARGET,
    scores: { [hostUid]: 0, [guestUid]: 0 },
    pushes: 0,
    rounds: 0,
    finished: false,
    starterUid: hostUid,
    lastOutcome: null,
  });
}

/** Resolve the round once both seats have finished, or hand off to the opponent. */
function advance(g: BlackjackRoomGame, stood: Record<string, boolean>, hands: Record<string, Card[]>, actingUid: string): Partial<BlackjackRoomGame> {
  const opponentUid = g.order.find((id) => id !== actingUid)!;

  if (!stood[opponentUid]) {
    return { hands, stood, turn: opponentUid };
  }

  // Both done — decide the round. Bust always loses; otherwise closest to 21.
  const totals: Record<string, number> = {};
  const busts: Record<string, boolean> = {};
  for (const uid of g.order) {
    const value = calculateHandValue(hands[uid]);
    totals[uid] = value.total;
    busts[uid] = value.isBust;
  }
  const [a, b] = g.order;
  let winnerUid: string | null;
  if (busts[a] && busts[b]) winnerUid = null;
  else if (busts[a]) winnerUid = b;
  else if (busts[b]) winnerUid = a;
  else if (totals[a] === totals[b]) winnerUid = null;
  else winnerUid = totals[a] > totals[b] ? a : b;

  const scores = { ...g.scores };
  if (winnerUid) scores[winnerUid] = (scores[winnerUid] ?? 0) + 1;
  const pushes = g.pushes + (winnerUid ? 0 : 1);
  const rounds = g.rounds + 1;
  const finished = Object.values(scores).some((score) => score >= g.target);
  const lastOutcome = { winnerUid, totals, busts };

  if (finished) {
    return { hands, stood, turn: null, scores, pushes, rounds, finished: true, lastOutcome };
  }

  // Next round: fresh deal, alternate the starter.
  const nextStarter = g.starterUid === a ? b : a;
  const nextOrder = [nextStarter, nextStarter === a ? b : a];
  const { deck, hands: nextHands } = deal(nextOrder);
  return {
    deck,
    hands: nextHands,
    stood: Object.fromEntries(nextOrder.map((uid) => [uid, false])),
    turn: nextOrder[0],
    order: nextOrder,
    scores,
    pushes,
    rounds,
    starterUid: nextStarter,
    lastOutcome,
  };
}

export async function hitBlackjack(code: string, uid: string): Promise<void> {
  await runRoomUpdate<BlackjackRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid || g.stood[uid]) return null;
    if (g.deck.length === 0) return null;

    const deck = [...g.deck];
    const card = deck.pop()!;
    const hands = { ...g.hands, [uid]: [...g.hands[uid], card] };
    const value = calculateHandValue(hands[uid]);

    if (!value.isBust) {
      // Still under 21 — keep acting.
      return { game: { ...g, deck, hands } };
    }

    // Bust ends this seat's turn.
    const stood = { ...g.stood, [uid]: true };
    const patch = advance({ ...g, deck }, stood, hands, uid);
    return { game: { ...g, deck, ...patch }, status: patch.finished ? "finished" : room.status };
  });
}

export async function standBlackjack(code: string, uid: string): Promise<void> {
  await runRoomUpdate<BlackjackRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid || g.stood[uid]) return null;

    const stood = { ...g.stood, [uid]: true };
    const patch = advance(g, stood, g.hands, uid);
    return { game: { ...g, ...patch }, status: patch.finished ? "finished" : room.status };
  });
}

export async function resetBlackjackRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<BlackjackRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    const order = [room.hostUid, uids.find((id) => id !== room.hostUid)!];
    return {
      game: freshRound(order, {
        target: BLACKJACK_ROOM_TARGET,
        scores: Object.fromEntries(order.map((uid) => [uid, 0])),
        pushes: 0,
        rounds: 0,
        finished: false,
        starterUid: order[0],
        lastOutcome: null,
      }),
      status: "playing",
      rematchVotes: {},
    };
  });
}
