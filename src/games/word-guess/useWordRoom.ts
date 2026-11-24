"use client";

/**
 * Word Guess room hook — sibling to useWordGuess.ts, backed by Firestore
 * instead of a local AI. Turn-based: the guessing player's own transaction
 * fully applies the result (reusing the pure applyGuess rule server-side).
 * Same soft-expiry story and same deliberate omission of ScoresContext.record()
 * as the other room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { guessError } from "./logic";
import type { GuessKind } from "./types";
import { resetWordRoomForRematch, submitWordGuess, type WordRoomGame } from "./room";

export type WordRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseWordRoomResult {
  uid: string | null;
  room: RoomDoc<WordRoomGame> | null;
  stage: WordRoomStage;
  isMyTurn: boolean;
  inputError: string;
  guess: (kind: GuessKind, rawValue: string) => boolean;
  playAgain: () => void;
  leave: () => void;
}

export function useWordRoom(code: string): UseWordRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<WordRoomGame> | null>(null);
  const [stage, setStage] = useState<WordRoomStage>("connecting");
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<WordRoomGame>(
          code,
          (doc) => {
            setRoom(doc);
            if (!doc) {
              setStage("gone");
              return;
            }
            if (isRoomExpired(doc)) {
              setStage("expired");
              return;
            }
            if (doc.status === "abandoned") {
              setStage("gone");
              return;
            }
            setStage(doc.status);
          },
          () => setStage("error"),
        );
      })
      .catch(() => setStage("error"));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  const guess = useCallback(
    (kind: GuessKind, rawValue: string): boolean => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return false;
      const g = room.game;
      if (g.finished || g.turn !== uid) return false;
      const error = guessError(g, kind, rawValue);
      setInputError(error);
      if (error) return false;
      submitWordGuess(code, uid, kind, rawValue).catch((error) => console.warn("submitWordGuess", error));
      return true;
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetWordRoomForRematch(code))
      .catch((error) => console.warn("word playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, isMyTurn, inputError, guess, playAgain, leave };
}
