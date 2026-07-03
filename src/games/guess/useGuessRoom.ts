"use client";

/**
 * Number Duel room hook — sibling to useGuessGame.ts, backed by Firestore
 * instead of a local AI. Turn-based like TTT (the moving player's own
 * transaction fully applies the result — no separate resolve step). Same
 * soft-expiry story and same deliberate omission of ScoresContext.record()
 * as the other room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { resetGuessRoomForRematch, submitGuess, type GuessRoomGame } from "./room";

export type GuessRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseGuessRoomResult {
  uid: string | null;
  room: RoomDoc<GuessRoomGame> | null;
  stage: GuessRoomStage;
  isMyTurn: boolean;
  guess: (value: number) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useGuessRoom(code: string): UseGuessRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<GuessRoomGame> | null>(null);
  const [stage, setStage] = useState<GuessRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<GuessRoomGame>(
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

  const guess = useCallback(
    (value: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.turn !== uid) return;
      submitGuess(code, uid, value).catch((error) => console.warn("submitGuess", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetGuessRoomForRematch(code))
      .catch((error) => console.warn("guess playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  return { uid, room, stage, isMyTurn, guess, playAgain, leave };
}
