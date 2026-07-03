/**
 * Spellstorm — room (PvP) state and mutations.
 *
 * Sibling to ai.ts, not a replacement: solo mode duels a WPM-timeline AI mage.
 * PvP is a live 75-second typing duel. Each client is authoritative for its
 * OWN mage: it applies its own typed words (energy/combo) and any spells the
 * opponent has cast at it, then mirrors that mage into the doc so the opponent
 * can render its health bar. A cast writes a small spell EVENT to `spells[uid]`
 * that the opponent's client consumes exactly once (idempotent by event id).
 * No `turn` field — both act continuously, each writing only its own fields.
 *
 * Both clients build the SAME word deck from the shared `seed` + `lang`
 * (createWordDeck), so the two mages face an identical word stream. The match
 * resolves once both players are done (timer expired or knocked out): the mage
 * with more health wins.
 */

"use client";

import { arrayUnion, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { randomSeed } from "@/lib/rng";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { createMage } from "./logic";
import type { Element, Mage } from "./types";
import { MATCH_SECONDS } from "./types";

export const STORM_ROOM_LANG: "en" | "es" = "en";

export interface StormSpellEvent {
  id: number;
  spell: Element;
}

export interface StormRoomGame {
  seed: number;
  lang: "en" | "es";
  /** Match end wall-clock time in ms; both clients count down to it. */
  endsAt: number;
  mages: Record<string, Mage>;
  /** Spells cast BY each uid (target = the opponent, who applies them). */
  spells: Record<string, StormSpellEvent[]>;
  done: Record<string, boolean>;
  finished: boolean;
  winnerUid: string | null;
}

function freshGame(uids: string[]): StormRoomGame {
  return {
    seed: randomSeed(),
    lang: STORM_ROOM_LANG,
    endsAt: Date.now() + MATCH_SECONDS * 1000,
    mages: Object.fromEntries(uids.map((uid) => [uid, createMage()])),
    spells: Object.fromEntries(uids.map((uid) => [uid, []])),
    done: Object.fromEntries(uids.map((uid) => [uid, false])),
    finished: false,
    winnerUid: null,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedStormRoomGame. */
export function createInitialStormRoomGame(): StormRoomGame {
  return freshGame([]);
}

/** Real seed, once both uids are known (called by joinRoom) — starts the 75s clock. */
export function seedStormRoomGame(
  _hostGame: StormRoomGame,
  hostUid: string,
  guestUid: string,
): StormRoomGame {
  return freshGame([hostUid, guestUid]);
}

/** Mirror this client's own mage into the doc (for the opponent's HUD). */
export async function pushMage(code: string, uid: string, mage: Mage): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.mages.${uid}`]: mage,
    updatedAt: serverTimestamp(),
  });
}

/** Cast: mirror the updated caster mage AND append a spell event for the opponent. */
export async function pushCast(
  code: string,
  uid: string,
  mage: Mage,
  event: StormSpellEvent,
): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.mages.${uid}`]: mage,
    [`game.spells.${uid}`]: arrayUnion(event),
    updatedAt: serverTimestamp(),
  });
}

/** Finish this client's bout (timer up or knocked out); resolves once both are done. */
export async function finishStorm(code: string, uid: string, mage: Mage): Promise<void> {
  await updateDoc(doc(getDb(), "rooms", code), {
    [`game.mages.${uid}`]: mage,
    [`game.done.${uid}`]: true,
    updatedAt: serverTimestamp(),
  });
}

/** Called by both clients once both bouts are done; decides the winner once. */
export async function resolveStormIfReady(code: string): Promise<void> {
  await runRoomUpdate<StormRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished) return null;

    const uids = Object.keys(g.done);
    if (uids.length !== 2 || !uids.every((id) => g.done[id])) return null;
    const [a, b] = uids;
    const ha = g.mages[a]?.health ?? 0;
    const hb = g.mages[b]?.health ?? 0;
    const winnerUid = ha === hb ? null : ha > hb ? a : b;

    return { game: { ...g, finished: true, winnerUid }, status: "finished" };
  });
}

export async function resetStormRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<StormRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
