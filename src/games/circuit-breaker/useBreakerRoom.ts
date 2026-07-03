"use client";

/**
 * Circuit Breaker room hook — sibling to useCircuitBreaker.ts, backed by
 * Firestore instead of a local AI cycle. Lockstep simultaneous turns: each
 * tick both players commit a turn, and either client resolves the tick once
 * both are in (idempotent, like RPS). Same soft-expiry story and same
 * deliberate omission of ScoresContext.record() as the other room hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import type { TurnAction } from "./types";
import {
  resetBreakerRoomForRematch,
  resolveBreakerTickIfReady,
  submitBreakerAction,
  type BreakerRoomGame,
} from "./room";

export type BreakerRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseBreakerRoomResult {
  uid: string | null;
  room: RoomDoc<BreakerRoomGame> | null;
  stage: BreakerRoomStage;
  committed: boolean;
  turn: (action: TurnAction) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useBreakerRoom(code: string): UseBreakerRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<BreakerRoomGame> | null>(null);
  const [stage, setStage] = useState<BreakerRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<BreakerRoomGame>(
          code,
          (doc) => {
            setRoom(doc);
            if (!doc) return setStage("gone");
            if (isRoomExpired(doc)) return setStage("expired");
            if (doc.status === "abandoned") return setStage("gone");
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

  // Either client resolves the tick once both turns are committed.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.pending);
    if (uids.length !== 2) return;
    if (uids.every((id) => room.game.pending[id]) && !resolvingRef.current) {
      resolvingRef.current = true;
      resolveBreakerTickIfReady(code)
        .catch((error) => console.warn("resolveBreakerTickIfReady", error))
        .finally(() => {
          resolvingRef.current = false;
        });
    }
  }, [room, code]);

  const turn = useCallback(
    (action: TurnAction) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      if (room.game.finished || room.game.pending[uid]) return;
      if (!room.game.cycles[uid]?.alive) return;
      submitBreakerAction(code, uid, action).catch((error) => console.warn("submitBreakerAction", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetBreakerRoomForRematch(code))
      .catch((error) => console.warn("breaker playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const committed = Boolean(uid && room?.game.pending[uid]);

  return { uid, room, stage, committed, turn, playAgain, leave };
}
