"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  drawDominoRoomTile,
  passDominoRoomTurn,
  playDominoRoomTile,
  resetDominoRoomForRematch,
  type DominoRoomGame,
} from "./room";
import type { DominoSide } from "./types";

export type DominoRoomStage = "connecting" | "waiting" | "playing" | "finished" | "gone" | "expired" | "error";

export function useDominoRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<DominoRoomGame> | null>(null);
  const [stage, setStage] = useState<DominoRoomStage>("connecting");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<DominoRoomGame>(
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
    setSelected((current) => (current === tileId ? null : tileId));
  }, []);

  const play = useCallback(
    (side: DominoSide) => {
      if (!uid || !room || room.game.turn !== uid || !selected) return;
      playDominoRoomTile(code, uid, selected, side)
        .then(() => setSelected(null))
        .catch((error) => console.warn("playDominoRoomTile", error));
    },
    [code, room, selected, uid],
  );

  const draw = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid) return;
    drawDominoRoomTile(code, uid)
      .then(() => setSelected(null))
      .catch((error) => console.warn("drawDominoRoomTile", error));
  }, [code, room, uid]);

  const pass = useCallback(() => {
    if (!uid || !room || room.game.turn !== uid) return;
    passDominoRoomTurn(code, uid)
      .then(() => setSelected(null))
      .catch((error) => console.warn("passDominoRoomTurn", error));
  }, [code, room, uid]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetDominoRoomForRematch(code))
      .catch((error) => console.warn("domino rematch", error));
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
    play,
    draw,
    pass,
    playAgain,
    leave,
  };
}
