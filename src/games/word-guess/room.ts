/**
 * Word Guess — room (PvP) state and mutations.
 *
 * Sibling to logic.ts/ai.ts, not a replacement: solo-vs-AI keeps using
 * WordGuessState with the information-gain AI. PvP reuses the SAME pure
 * `applyGuess` rule wholesale by mapping the two seats onto its existing
 * player/ai actors: host ↔ "player", guest ↔ "ai". Only two things are new:
 *   - Firestore can't store a Set, so `revealedLetters`/`guessedLetters` are
 *     persisted as arrays and rebuilt into Sets inside each transaction.
 *   - a `turn` field (uid) mirrors `currentTurn` so firestore.rules' generic
 *     turn guard rejects out-of-turn writes; it's derived back to an actor
 *     for applyGuess and re-derived to a uid afterwards.
 *
 * One word per match (like solo); a rematch draws a fresh word. Trust model
 * for the hidden word is the same accepted trade-off as the other rooms.
 */

"use client";

import { randomInt } from "@/lib/random";
import { runRoomUpdate } from "@/lib/rooms/roomsApi";
import { foldLetter } from "./letters";
import { applyGuess } from "./logic";
import type {
  GuessKind,
  WordActor,
  WordCategory,
  WordDifficulty,
  WordFeedback,
  WordGuessEntry,
  WordGuessState,
  WordLang,
  WordWinner,
} from "./types";
import { WORD_CATEGORIES, wordsForDifficulty } from "./words";

export const WORD_ROOM_DIFFICULTY: WordDifficulty = "medium";
const LANGS: WordLang[] = ["en", "es"];

/** Serialised WordGuessState — Sets flattened to arrays, plus the seat↔actor map. */
export interface WordRoomGame {
  word: string;
  category: WordCategory;
  difficulty: WordDifficulty;
  lang: WordLang;
  revealedLetters: string[];
  guessedLetters: string[];
  /** "player" mistakes = host's, "ai" mistakes = guest's (see actor mapping). */
  playerMistakes: number;
  aiMistakes: number;
  /** uid whose turn it is; `null` once finished. */
  turn: string | null;
  history: WordGuessEntry[];
  lastFeedback: WordFeedback | null;
  finished: boolean;
  winner: WordWinner | null;
  hostUid: string;
  guestUid: string;
}

function pickWord(): { word: string; category: WordCategory; lang: WordLang } {
  const lang = LANGS[randomInt(0, LANGS.length - 1)];
  const category = WORD_CATEGORIES[randomInt(0, WORD_CATEGORIES.length - 1)];
  const pool = wordsForDifficulty(category, WORD_ROOM_DIFFICULTY, lang);
  return { word: pool[randomInt(0, pool.length - 1)], category, lang };
}

function freshGame(hostUid: string, guestUid: string): WordRoomGame {
  const { word, category, lang } = pickWord();
  return {
    word,
    category,
    difficulty: WORD_ROOM_DIFFICULTY,
    lang,
    revealedLetters: [],
    guessedLetters: [],
    playerMistakes: 0,
    aiMistakes: 0,
    turn: hostUid,
    history: [],
    lastFeedback: null,
    finished: false,
    winner: null,
    hostUid,
    guestUid,
  };
}

/** Host-only placeholder while the room is still "waiting" — see seedWordRoomGame. */
export function createInitialWordRoomGame(): WordRoomGame {
  return { ...freshGame("", ""), turn: null };
}

/** Real seed, once both uids are known. Host ("player") moves first. */
export function seedWordRoomGame(
  _hostGame: WordRoomGame,
  hostUid: string,
  guestUid: string,
): WordRoomGame {
  return freshGame(hostUid, guestUid);
}

/** Rehydrate the pure WordGuessState (with Sets) that applyGuess expects. */
function toState(g: WordRoomGame, actor: WordActor): WordGuessState {
  return {
    word: g.word,
    category: g.category,
    difficulty: g.difficulty,
    lang: g.lang,
    revealedLetters: new Set(g.revealedLetters),
    guessedLetters: new Set(g.guessedLetters),
    playerMistakes: g.playerMistakes,
    aiMistakes: g.aiMistakes,
    currentTurn: actor,
    history: g.history,
    feedback: null,
    finished: g.finished,
    winner: g.winner,
  };
}

export async function submitWordGuess(
  code: string,
  uid: string,
  kind: GuessKind,
  rawValue: string,
): Promise<void> {
  await runRoomUpdate<WordRoomGame>(code, (room) => {
    const g = room.game;
    if (room.status !== "playing" || g.finished || g.turn !== uid) return null;

    const actor: WordActor = uid === g.hostUid ? "player" : "ai";

    // Cheap dedupe (the UI also disables these): don't waste a turn re-guessing.
    if (kind === "letter" && g.guessedLetters.includes(foldLetter(rawValue))) return null;

    const state = toState(g, actor);
    const next = applyGuess(state, actor, kind, rawValue);
    // applyGuess returns the same reference when nothing changed (e.g. wrong turn).
    if (next === state) return null;

    const nextTurnUid = next.finished
      ? null
      : next.currentTurn === "player"
        ? g.hostUid
        : g.guestUid;

    return {
      game: {
        ...g,
        revealedLetters: [...next.revealedLetters],
        guessedLetters: [...next.guessedLetters],
        playerMistakes: next.playerMistakes,
        aiMistakes: next.aiMistakes,
        history: next.history,
        lastFeedback: next.feedback,
        finished: next.finished,
        winner: next.winner,
        turn: nextTurnUid,
      },
      status: next.finished ? "finished" : room.status,
    };
  });
}

export async function resetWordRoomForRematch(code: string): Promise<void> {
  await runRoomUpdate<WordRoomGame>(code, (room) => {
    if (room.status !== "finished") return null;
    const uids = Object.keys(room.players);
    if (uids.length !== 2 || !uids.every((uid) => room.rematchVotes[uid])) return null;

    return {
      game: freshGame(room.game.hostUid, room.game.guestUid),
      status: "playing",
      rematchVotes: {},
    };
  });
}
