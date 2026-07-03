/**
 * Signal Breaker — room (PvP) state and mutations.
 *
 * The solo game is already framed as a duel ("you crack the AI's code while it
 * cracks yours"); PvP is its natural form. Each player races to crack the
 * OTHER's secret code, self-paced (not lockstep — Mastermind guesses are
 * independent), reusing the pure `scoreGuess`/`isSolved`/`randomCode` rules.
 * The match resolves once both players are done (solved or out of guesses):
 * fewer guesses wins, solving beats not solving.
 *
 * No `turn` field — either player may guess at any time, and each write only
 * touches its own `guesses`/`done` fields. Trust model: both secrets live in
 * the room doc (the scoring transaction must read them), so a determined peer
 * could read the code early — same accepted trade-off as the other rooms.
 */

"use client";

import { createRng, randomSeed } from "@/lib/rng";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { isSolved, randomCode, scoreGuess } from "./logic";
import { MAX_GUESSES } from "./types";
import type { Code, GuessRow } from "./types";

export const SIGNAL_ROOM_ALLOW_REPEATS = true;

export interface SignalRoomGame {
  /** secrets[uid] = the code THIS uid must crack (their opponent's code). */
  secrets: Record<string, Code>;
  guesses: Record<string, GuessRow[]>;
  solved: Record<string, boolean>;
  done: Record<string, boolean>;
  solvedAtGuess: Record<string, number | null>;
  maxGuesses: number;
  allowRepeats: boolean;
  finished: boolean;
  winnerUid: string | null;
}

function freshGame(uids: string[]): SignalRoomGame {
  const rng = createRng(randomSeed());
  return {
    secrets: Object.fromEntries(uids.map((uid) => [uid, randomCode(rng, SIGNAL_ROOM_ALLOW_REPEATS)])),
    guesses: Object.fromEntries(uids.map((uid) => [uid, []])),
    solved: Object.fromEntries(uids.map((uid) => [uid, false])),
    done: Object.fromEntries(uids.map((uid) => [uid, false])),
    solvedAtGuess: Object.fromEntries(uids.map((uid) => [uid, null])),
    maxGuesses: MAX_GUESSES,
    allowRepeats: SIGNAL_ROOM_ALLOW_REPEATS,
    finished: false,
    winnerUid: null,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedSignalRoomGame. */
export function createInitialSignalRoomGame(): SignalRoomGame {
  return freshGame([]);
}

/** Real seed, once both uids are known (called by joinRoom). */
export function seedSignalRoomGame(
  _hostGame: SignalRoomGame,
  hostUid: string,
  guestUid: string,
): SignalRoomGame {
  return freshGame([hostUid, guestUid]);
}

function decideWinner(g: SignalRoomGame, uids: string[]): string | null {
  const [a, b] = uids;
  if (g.solved[a] && g.solved[b]) {
    const ga = g.solvedAtGuess[a]!;
    const gb = g.solvedAtGuess[b]!;
    return ga === gb ? null : ga < gb ? a : b;
  }
  if (g.solved[a]) return a;
  if (g.solved[b]) return b;
  return null; // both failed
}

export async function submitSignalGuess(code: string, uid: string, guess: Code): Promise<void> {
  await runRoomUpdate<SignalRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.done[uid]) return null;

    const feedback = scoreGuess(g.secrets[uid], guess);
    const rows: GuessRow[] = [...(g.guesses[uid] ?? []), { guess, feedback }];
    const solvedNow = isSolved(feedback);
    const doneNow = solvedNow || rows.length >= g.maxGuesses;

    const next: SignalRoomGame = {
      ...g,
      guesses: { ...g.guesses, [uid]: rows },
      solved: { ...g.solved, [uid]: solvedNow || g.solved[uid] },
      done: { ...g.done, [uid]: doneNow },
      solvedAtGuess: { ...g.solvedAtGuess, [uid]: solvedNow ? rows.length : g.solvedAtGuess[uid] },
    };

    const uids = Object.keys(g.secrets);
    const bothDone = uids.every((id) => next.done[id]);
    if (bothDone) {
      next.finished = true;
      next.winnerUid = decideWinner(next, uids);
      return { game: next, status: "finished" };
    }
    return { game: next };
  });
}

export async function resetSignalRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<SignalRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;
    return { game: freshGame(uids), status: "playing", rematchVotes: {} };
  });
}
