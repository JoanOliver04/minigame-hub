"use client";

/**
 * Blackjack room hook — sibling to useBlackjack.ts, backed by Firestore
 * while preserving the fixed-rule dealer. Each player acts on their own
 * dealer hand; when both players finish a round the room advances. Same soft-expiry story and same deliberate omission of
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

  const hit = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    const seat = room.game.seats[uid];
    if (room.game.finished || !seat || seat.ready || seat.outcome) return;
    hitBlackjack(code, uid).catch((error) => console.warn("hitBlackjack", error));
  }, [uid, room, code]);

  const stand = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    const seat = room.game.seats[uid];
    if (room.game.finished || !seat || seat.ready || seat.outcome) return;
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

  return { uid, room, stage, hit, stand, playAgain, leave };
}
