/**
 * Higher or Lower — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * HigherOrLowerMatch (player/ai stats, card-counting AI). PvP is a turn-based
 * duel over a SHARED shuffled deck: players alternate calling higher/lower on
 * the next card; a correct call scores a point. First to `target` points, or
 * the higher score when the deck runs out, wins.
 *
 * Reuses the pure `compareCards`/`isPredictionCorrect` rules and the shared
 * deck primitives — only the uid-keyed turn/score bookkeeping is new.
 *
 * Turn safety: carries a `turn` field, so firestore.rules' generic turn guard
 * rejects out-of-turn writes for free. Trust model for the hidden deck order
 * is the same accepted trade-off as the other room games (see README §2).
 */

"use client";

import {
  createStandardDeck,
  shuffleDeck,
  type Card,
} from "@/lib/cards";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import type { RoomGameSettings } from "../roomTypes";
import { isPredictionCorrect } from "./logic";
import type { Prediction } from "./types";

export const HOL_ROOM_TARGET = 5;
export const HOL_ROOM_ACE_HIGH = true;

/** Only two calls are offered in PvP (an equal-rank next card is simply a miss). */
export type HolCall = "higher" | "lower";

export interface HolRoomHistoryEntry {
  id: number;
  uid: string;
  call: HolCall;
  fromCard: Card;
  nextCard: Card;
  correct: boolean;
}

export interface HolRoomGame {
  target: number;
  aceHigh: boolean;
  scores: Record<string, number>;
  rounds: number;
  finished: boolean;
  /** uid to call now; `null` once the match is finished. */
  turn: string | null;
  /** Remaining deck, drawn from the end. */
  deck: Card[];
  currentCard: Card;
  history: HolRoomHistoryEntry[];
}

const HISTORY_CAP = 12;

function targetFromSettings(settings?: RoomGameSettings): number {
  const target = Number(settings?.target ?? HOL_ROOM_TARGET);
  return target === 3 || target === 10 ? target : HOL_ROOM_TARGET;
}

function aceHighFromSettings(settings?: RoomGameSettings): boolean {
  return settings?.aceHigh === "false" ? false : HOL_ROOM_ACE_HIGH;
}

function freshDeck(): { deck: Card[]; currentCard: Card } {
  const deck = shuffleDeck(createStandardDeck());
  return { deck: deck.slice(0, -1), currentCard: deck[deck.length - 1] };
}

/** Host-only placeholder while the room is still "waiting" — see seedHolRoomGame. */
export function createInitialHolRoomGame(settings?: RoomGameSettings): HolRoomGame {
  const { deck, currentCard } = freshDeck();
  return {
    target: targetFromSettings(settings),
    aceHigh: aceHighFromSettings(settings),
    scores: {},
    rounds: 0,
    finished: false,
    turn: null,
    deck,
    currentCard,
    history: [],
  };
}

/** Real seed, once both uids are known (called by joinRoom). Host calls first. */
export function seedHolRoomGame(
  _hostGame: HolRoomGame,
  hostUid: string,
  guestUid: string,
  settings?: RoomGameSettings,
): HolRoomGame {
  const { deck, currentCard } = freshDeck();
  return {
    target: targetFromSettings(settings),
    aceHigh: aceHighFromSettings(settings),
    scores: { [hostUid]: 0, [guestUid]: 0 },
    rounds: 0,
    finished: false,
    turn: hostUid,
    deck,
    currentCard,
    history: [],
  };
}

export async function submitCall(code: string, uid: string, call: HolCall): Promise<void> {
  await runRoomUpdate<HolRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;
    if (g.deck.length === 0) return null;

    const uids = Object.keys(g.scores);
    const opponentUid = uids.find((id) => id !== uid);
    if (!opponentUid) return null;

    const nextCard = g.deck[g.deck.length - 1];
    const correct = isPredictionCorrect(call as Prediction, g.currentCard, nextCard, g.aceHigh);
    const scores = { ...g.scores };
    if (correct) scores[uid] = (scores[uid] ?? 0) + 1;

    const rounds = g.rounds + 1;
    const deck = g.deck.slice(0, -1);
    const finished = scores[uid] >= g.target || deck.length === 0;
    const entry: HolRoomHistoryEntry = {
      id: rounds,
      uid,
      call,
      fromCard: g.currentCard,
      nextCard,
      correct,
    };

    return {
      game: {
        ...g,
        scores,
        rounds,
        deck,
        currentCard: nextCard,
        finished,
        turn: finished ? null : opponentUid,
        history: [entry, ...g.history].slice(0, HISTORY_CAP),
      },
      status: finished ? "finished" : room.status,
    };
  });
}

/** Fires once both seated players have voted rematch; idempotent otherwise. */
export async function resetHolRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<HolRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    const { deck, currentCard } = freshDeck();

    return {
      game: {
        target: room.game.target,
        aceHigh: room.game.aceHigh,
        scores: Object.fromEntries(uids.map((uid) => [uid, 0])),
        rounds: 0,
        finished: false,
        turn: room.hostUid,
        deck,
        currentCard,
        history: [],
      },
      status: "playing",
      rematchVotes: {},
    };
  });
}
