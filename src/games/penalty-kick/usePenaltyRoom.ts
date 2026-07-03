"use client";

/**
 * Penalty Kick room hook — sibling to usePenaltyKickGame.ts, backed by
 * Firestore instead of a local AI. Same simultaneous-move resolution story
 * as useRpsRoom.ts (either client resolves once both blind moves are in) and
 * the same soft-expiry story: no Firestore TTL policy, expiry enforced by
 * firestore.rules' `notExpired()` plus the guards below. Deliberately does
 * NOT call ScoresContext.record() — that scoreboard is solo-vs-AI only.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  resetPenaltyRoomForRematch,
  resolvePenaltyRoundIfReady,
  submitPenaltyMove,
  type PenaltyRoomGame,
  type PenaltyZone,
} from "./room";

export type PenaltyRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UsePenaltyRoomResult {
  uid: string | null;
  room: RoomDoc<PenaltyRoomGame> | null;
  stage: PenaltyRoomStage;
  /** True once this uid has submitted a zone for the current round. */
  hasSubmitted: boolean;
  /** True when it's this uid's turn to shoot (false = keeper this round). */
  isShooter: boolean;
  playZone: (zone: PenaltyZone) => void;
  playAgain: () => void;
  leave: () => void;
}

export function usePenaltyRoom(code: string): UsePenaltyRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<PenaltyRoomGame> | null>(null);
  const [stage, setStage] = useState<PenaltyRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<PenaltyRoomGame>(
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
      resolvePenaltyRoundIfReady(code)
        .catch((error) => console.warn("resolvePenaltyRoundIfReady", error))
        .finally(() => {
          resolvingRef.current = false;
        });
    }
  }, [room, code]);

  const playZone = useCallback(
    (zone: PenaltyZone) => {
      if (!uid || !room || room.game.pendingMoves[uid] || isRoomExpired(room)) return;
      submitPenaltyMove(code, uid, zone).catch((error) => console.warn("submitPenaltyMove", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetPenaltyRoomForRematch(code))
      .catch((error) => console.warn("penalty playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const hasSubmitted = Boolean(uid && room?.game.pendingMoves[uid]);
  const isShooter = Boolean(uid && room?.game.shooterUid === uid);

  return { uid, room, stage, hasSubmitted, isShooter, playZone, playAgain, leave };
}
