"use client";

/**
 * Hex Dominion room hook — sibling to useHexDominion.ts, backed by Firestore
 * instead of a local AI. Strictly turn-based like TTT: the moving player's own
 * transaction applies the stone and detects a connection. Same soft-expiry
 * story and same deliberate omission of ScoresContext.record() as the others.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { resetHexRoomForRematch, submitHexMove, type HexRoomGame } from "./room";

export type HexRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseHexRoomResult {
  uid: string | null;
  room: RoomDoc<HexRoomGame> | null;
  stage: HexRoomStage;
  isMyTurn: boolean;
  play: (index: number) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useHexRoom(code: string): UseHexRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<HexRoomGame> | null>(null);
  const [stage, setStage] = useState<HexRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<HexRoomGame>(
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
    (index: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.turn !== uid || g.board[index] !== null) return;
      submitHexMove(code, uid, index).catch((error) => console.warn("submitHexMove", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetHexRoomForRematch(code))
      .catch((error) => console.warn("hex playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  return { uid, room, stage, isMyTurn, play, playAgain, leave };
}
