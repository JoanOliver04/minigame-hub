"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  drawTileRummyRoomTile,
  playTileRummyRoomMeld,
  resetTileRummyRoomForRematch,
  type TileRummyRoomGame,
} from "./room";

export type TileRummyRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export function useTileRummyRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<TileRummyRoomGame> | null>(null);
  const [stage, setStage] = useState<TileRummyRoomStage>("connecting");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<TileRummyRoomGame>(
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

  const toggle = useCallback((tileId: string) => {
    setSelected((current) =>
      current.includes(tileId) ? current.filter((id) => id !== tileId) : [...current, tileId],
    );
  }, []);

  const playSelected = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid) return;
    playTileRummyRoomMeld(code, uid, selected)
      .then(() => setSelected([]))
      .catch((error) => console.warn("playTileRummyRoomMeld", error));
  }, [code, room, selected, uid]);

  const draw = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid) return;
    drawTileRummyRoomTile(code, uid)
      .then(() => setSelected([]))
      .catch((error) => console.warn("drawTileRummyRoomTile", error));
  }, [code, room, uid]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetTileRummyRoomForRematch(code))
      .catch((error) => console.warn("tile rummy rematch", error));
  }, [code, room, uid]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    selected,
    isMyTurn: Boolean(uid && room?.game.turn === uid),
    toggle,
    playSelected,
    draw,
    playAgain,
    leave,
  };
}
