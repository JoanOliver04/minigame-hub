"use client";

/**
 * Connect Four room hook — sibling to useConnectFour.ts, backed by Firestore
 * instead of a local AI. Strictly turn-based like TTT: the moving player's
 * own transaction fully applies the result. Same soft-expiry story and same
 * deliberate omission of ScoresContext.record() as the other room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  resetConnectRoomForRematch,
  submitConnectMove,
  type ConnectRoomGame,
} from "./room";

export type ConnectRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseConnectRoomResult {
  uid: string | null;
  room: RoomDoc<ConnectRoomGame> | null;
  stage: ConnectRoomStage;
  isMyTurn: boolean;
  playColumn: (column: number) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useConnectRoom(code: string): UseConnectRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ConnectRoomGame> | null>(null);
  const [stage, setStage] = useState<ConnectRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<ConnectRoomGame>(
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

  const playColumn = useCallback(
    (column: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.turn !== uid) return;
      submitConnectMove(code, uid, column).catch((error) => console.warn("submitConnectMove", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetConnectRoomForRematch(code))
      .catch((error) => console.warn("connect playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  return { uid, room, stage, isMyTurn, playColumn, playAgain, leave };
}
