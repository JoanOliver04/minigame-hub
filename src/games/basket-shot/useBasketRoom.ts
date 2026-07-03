"use client";

/**
 * Basket Shot room hook — sibling to useBasketShotGame.ts, backed by
 * Firestore instead of a local AI. Same simultaneous-move resolution and
 * soft-expiry story as useRpsRoom.ts / usePenaltyRoom.ts. Deliberately does
 * NOT call ScoresContext.record() — that scoreboard is solo-vs-AI only.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  resetBasketRoomForRematch,
  resolveBasketRoundIfReady,
  submitBasketMove,
  type BasketRoomGame,
  type BasketSpot,
} from "./room";

export type BasketRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseBasketRoomResult {
  uid: string | null;
  room: RoomDoc<BasketRoomGame> | null;
  stage: BasketRoomStage;
  /** True once this uid has submitted a spot for the current round. */
  hasSubmitted: boolean;
  /** True when it's this uid's turn to shoot (false = defender this round). */
  isShooter: boolean;
  playSpot: (spot: BasketSpot) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useBasketRoom(code: string): UseBasketRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<BasketRoomGame> | null>(null);
  const [stage, setStage] = useState<BasketRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<BasketRoomGame>(
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

  // Either connected client resolves the round once both moves are in —
  // idempotent-safe no-op if the other client's transaction already did.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.pendingMoves);
    if (uids.length !== 2) return;
    if (uids.every((id) => room.game.pendingMoves[id]) && !resolvingRef.current) {
      resolvingRef.current = true;
      resolveBasketRoundIfReady(code)
        .catch((error) => console.warn("resolveBasketRoundIfReady", error))
        .finally(() => {
          resolvingRef.current = false;
        });
    }
  }, [room, code]);

  const playSpot = useCallback(
    (spot: BasketSpot) => {
      if (!uid || !room || room.game.pendingMoves[uid] || isRoomExpired(room)) return;
      submitBasketMove(code, uid, spot).catch((error) => console.warn("submitBasketMove", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetBasketRoomForRematch(code))
      .catch((error) => console.warn("basket playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const hasSubmitted = Boolean(uid && room?.game.pendingMoves[uid]);
  const isShooter = Boolean(uid && room?.game.shooterUid === uid);

  return { uid, room, stage, hasSubmitted, isShooter, playSpot, playAgain, leave };
}
