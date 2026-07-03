"use client";

/**
 * RPS room hook — sibling to useRpsGame.ts, backed by Firestore instead of
 * a local AI. Deliberately does NOT call ScoresContext.record(): the global
 * scoreboard on the hub is specifically "you vs AI" (see StatsTable); a PvP
 * result recorded under the same "rps" key would silently conflate two
 * different kinds of match. Each room's own score/history is the record of
 * that match. Rooms carry `expiresAt` but there's no Firestore TTL policy
 * wired up (see firestore.rules) — expiry is enforced by the rules'
 * `notExpired()` check plus this hook bailing out client-side (see the
 * "expired" stage below and the guards in playMove/playAgain).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import type { Move } from "./logic";
import {
  resetRpsRoomForRematch,
  resolveRpsRoundIfReady,
  submitRpsMove,
  type RpsRoomGame,
} from "./room";

export type RpsRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseRpsRoomResult {
  uid: string | null;
  room: RoomDoc<RpsRoomGame> | null;
  stage: RpsRoomStage;
  /** True once this uid has submitted a move for the current round. */
  hasSubmitted: boolean;
  playMove: (move: Move) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useRpsRoom(code: string): UseRpsRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<RpsRoomGame> | null>(null);
  const [stage, setStage] = useState<RpsRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<RpsRoomGame>(
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
      resolveRpsRoundIfReady(code).finally(() => {
        resolvingRef.current = false;
      });
    }
  }, [room, code]);

  const playMove = useCallback(
    (move: Move) => {
      if (!uid || !room || room.game.pendingMoves[uid] || isRoomExpired(room)) return;
      void submitRpsMove(code, uid, move);
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    void voteRematch(code, uid).then(() => resetRpsRoomForRematch(code));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    void leaveRoom(code);
  }, [code]);

  const hasSubmitted = Boolean(uid && room?.game.pendingMoves[uid]);

  return { uid, room, stage, hasSubmitted, playMove, playAgain, leave };
}
