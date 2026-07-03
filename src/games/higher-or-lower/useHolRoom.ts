"use client";

/**
 * Higher or Lower room hook — sibling to useHigherOrLowerGame.ts, backed by
 * Firestore instead of a local AI. Turn-based like TTT/Number Duel: the
 * calling player's own transaction fully applies the reveal. Same soft-expiry
 * story and same deliberate omission of ScoresContext.record() as the other
 * room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { resetHolRoomForRematch, submitCall, type HolCall, type HolRoomGame } from "./room";

export type HolRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseHolRoomResult {
  uid: string | null;
  room: RoomDoc<HolRoomGame> | null;
  stage: HolRoomStage;
  isMyTurn: boolean;
  call: (choice: HolCall) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useHolRoom(code: string): UseHolRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<HolRoomGame> | null>(null);
  const [stage, setStage] = useState<HolRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<HolRoomGame>(
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

  const call = useCallback(
    (choice: HolCall) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.turn !== uid) return;
      submitCall(code, uid, choice).catch((error) => console.warn("submitCall", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetHolRoomForRematch(code))
      .catch((error) => console.warn("hol playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  return { uid, room, stage, isMyTurn, call, playAgain, leave };
}
