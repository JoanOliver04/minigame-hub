"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  drawPrismRoomCard,
  playPrismRoomCard,
  resetPrismRoomForRematch,
  type PrismRoomGame,
} from "./room";
import type { PrismColor } from "./types";

export type PrismRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export function usePrismRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<PrismRoomGame> | null>(null);
  const [stage, setStage] = useState<PrismRoomStage>("connecting");
  const [pendingPrism, setPendingPrism] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<PrismRoomGame>(
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

  const play = useCallback(
    (cardIndex: number, color?: PrismColor) => {
      if (!uid || !room || room.game.turn !== uid || isRoomExpired(room)) return;
      playPrismRoomCard(code, uid, cardIndex, color).catch((error) =>
        console.warn("playPrismRoomCard", error),
      );
      setPendingPrism(null);
    },
    [code, room, uid],
  );

  const draw = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid || isRoomExpired(room)) return;
    drawPrismRoomCard(code, uid).catch((error) => console.warn("drawPrismRoomCard", error));
  }, [code, room, uid]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetPrismRoomForRematch(code))
      .catch((error) => console.warn("prism rematch", error));
  }, [code, room, uid]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    isMyTurn: Boolean(uid && room?.game.turn === uid),
    pendingPrism,
    setPendingPrism,
    play,
    draw,
    playAgain,
    leave,
  };
}
