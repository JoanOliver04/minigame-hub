"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  moveGooseRoom,
  rerollGooseRoom,
  resetGooseRoomForRematch,
  rollGooseRoom,
  type GooseRoomGame,
} from "./room";

export type GooseRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export function useGooseRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<GooseRoomGame> | null>(null);
  const [stage, setStage] = useState<GooseRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<GooseRoomGame>(
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
    if (!uid || !room || room.game.turn !== uid || room.game.die !== null) return;
    rollGooseRoom(code, uid, Math.floor(Math.random() * 6) + 1).catch((error) =>
      console.warn("rollGooseRoom", error),
    );
  }, [code, room, uid]);

  const reroll = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid || room.game.die === null) return;
    rerollGooseRoom(code, uid, Math.floor(Math.random() * 6) + 1).catch((error) =>
      console.warn("rerollGooseRoom", error),
    );
  }, [code, room, uid]);

  const move = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid || room.game.die === null) return;
    moveGooseRoom(code, uid).catch((error) => console.warn("moveGooseRoom", error));
  }, [code, room, uid]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetGooseRoomForRematch(code))
      .catch((error) => console.warn("goose rematch", error));
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
    reroll,
    move,
    playAgain,
    leave,
  };
}
