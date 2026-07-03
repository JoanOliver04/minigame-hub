"use client";

/**
 * Blackjack room hook — sibling to useBlackjack.ts, backed by Firestore
 * instead of a fixed-rule dealer. Turn-based like TTT: the acting player's own
 * transaction applies the hit/stand and, when both seats are done, resolves
 * the round. Same soft-expiry story and same deliberate omission of
 * ScoresContext.record() as the other room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  hitBlackjack,
  resetBlackjackRoomForRematch,
  standBlackjack,
  type BlackjackRoomGame,
} from "./room";

export type BlackjackRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseBlackjackRoomResult {
  uid: string | null;
  room: RoomDoc<BlackjackRoomGame> | null;
  stage: BlackjackRoomStage;
  isMyTurn: boolean;
  hit: () => void;
  stand: () => void;
  playAgain: () => void;
  leave: () => void;
}

export function useBlackjackRoom(code: string): UseBlackjackRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<BlackjackRoomGame> | null>(null);
  const [stage, setStage] = useState<BlackjackRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<BlackjackRoomGame>(
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

  const hit = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    if (room.game.finished || room.game.turn !== uid) return;
    hitBlackjack(code, uid).catch((error) => console.warn("hitBlackjack", error));
  }, [uid, room, code]);

  const stand = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    if (room.game.finished || room.game.turn !== uid) return;
    standBlackjack(code, uid).catch((error) => console.warn("standBlackjack", error));
  }, [uid, room, code]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetBlackjackRoomForRematch(code))
      .catch((error) => console.warn("blackjack playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, isMyTurn, hit, stand, playAgain, leave };
}
