"use client";

/**
 * Memory Match room hook — sibling to useMemoryMatch.ts, backed by Firestore
 * instead of a local AI. Turn-based, but a turn is two flips; a missed pair
 * enters an `evaluating` phase that this hook auto-resolves after a short
 * delay so both players get to memorise the tiles (idempotent, either client
 * can fire it — same pattern as RPS round resolution). Same soft-expiry story
 * and same deliberate omission of ScoresContext.record() as the other rooms.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  flipMemoryTile,
  resetMemoryRoomForRematch,
  resolveMemoryMiss,
  type MemoryRoomGame,
} from "./room";

const MISS_REVEAL_MS = 1100;

export type MemoryRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseMemoryRoomResult {
  uid: string | null;
  room: RoomDoc<MemoryRoomGame> | null;
  stage: MemoryRoomStage;
  isMyTurn: boolean;
  /** True when a flip is currently allowed for this player. */
  canFlip: boolean;
  flip: (index: number) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useMemoryRoom(code: string): UseMemoryRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<MemoryRoomGame> | null>(null);
  const [stage, setStage] = useState<MemoryRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<MemoryRoomGame>(
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

  // Auto-hide a missed pair after a short reveal delay. Both clients schedule
  // it; runRoomUpdate makes the loser's call a safe no-op.
  useEffect(() => {
    if (!room || room.status !== "playing" || room.game.phase !== "evaluating") return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    const timer = setTimeout(() => {
      resolveMemoryMiss(code)
        .catch((error) => console.warn("resolveMemoryMiss", error))
        .finally(() => {
          resolvingRef.current = false;
        });
    }, MISS_REVEAL_MS);
    return () => {
      clearTimeout(timer);
      resolvingRef.current = false;
    };
  }, [room, code]);

  const flip = useCallback(
    (index: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.turn !== uid || g.phase !== "flipping" || g.flipped.length >= 2) return;
      flipMemoryTile(code, uid, index).catch((error) => console.warn("flipMemoryTile", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetMemoryRoomForRematch(code))
      .catch((error) => console.warn("memory playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);
  const canFlip =
    isMyTurn &&
    room?.game.phase === "flipping" &&
    (room?.game.flipped.length ?? 2) < 2;

  return { uid, room, stage, isMyTurn, canFlip, flip, playAgain, leave };
}
