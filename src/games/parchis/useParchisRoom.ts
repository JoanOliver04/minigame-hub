"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  moveParchisRoom,
  resetParchisRoomForRematch,
  rollParchisRoom,
  type ParchisRoomGame,
} from "./room";

export type ParchisRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export function useParchisRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ParchisRoomGame> | null>(null);
  const [stage, setStage] = useState<ParchisRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<ParchisRoomGame>(
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

  const roll = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid || room.game.pendingSteps !== null) return;
    const value = Math.floor(Math.random() * 6) + 1;
    rollParchisRoom(code, uid, value).catch((error) => console.warn("rollParchisRoom", error));
  }, [code, room, uid]);

  const move = useCallback((pieceId: number) => {
    if (!uid || !room || room.game.turn !== uid) return;
    moveParchisRoom(code, uid, pieceId).catch((error) => console.warn("moveParchisRoom", error));
  }, [code, room, uid]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetParchisRoomForRematch(code))
      .catch((error) => console.warn("parchis rematch", error));
  }, [code, room, uid]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    isMyTurn: Boolean(uid && room?.game.turn === uid),
    roll,
    move,
    playAgain,
    leave,
  };
}
