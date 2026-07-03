"use client";

/**
 * Nim room hook — sibling to useNim.ts, backed by Firestore instead of a
 * local AI. Turn-based like TTT: the moving player's own transaction fully
 * applies the result. Local `pendingSelection` holds the tokens picked before
 * the player confirms the move. Same soft-expiry story and same deliberate
 * omission of ScoresContext.record() as the other room hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { resetNimRoomForRematch, submitNimMove, type NimRoomGame } from "./room";

export interface NimSelection {
  pileIndex: number;
  tokensRemoved: number;
}

export type NimRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseNimRoomResult {
  uid: string | null;
  room: RoomDoc<NimRoomGame> | null;
  stage: NimRoomStage;
  isMyTurn: boolean;
  selection: NimSelection | null;
  selectToken: (pileIndex: number, tokenIndex: number) => void;
  clearSelection: () => void;
  confirmMove: () => void;
  playAgain: () => void;
  leave: () => void;
}

export function useNimRoom(code: string): UseNimRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<NimRoomGame> | null>(null);
  const [stage, setStage] = useState<NimRoomStage>("connecting");
  const [selection, setSelection] = useState<NimSelection | null>(null);
  const lastTurnRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<NimRoomGame>(
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

  // Drop a stale selection whenever the turn changes (mine ended, or a new
  // round reset the piles) — guarded by a ref so we only reset on a change.
  useEffect(() => {
    const turn = room?.game.turn ?? null;
    if (turn !== lastTurnRef.current) {
      lastTurnRef.current = turn;
      setSelection(null);
    }
  }, [room?.game.turn]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  const selectToken = useCallback(
    (pileIndex: number, tokenIndex: number) => {
      if (!room || !isMyTurn) return;
      const pileSize = room.game.piles[pileIndex];
      if (pileSize <= 0) return;
      // Selecting a token marks it plus everything above it in the pile.
      setSelection({ pileIndex, tokensRemoved: pileSize - tokenIndex });
    },
    [room, isMyTurn],
  );

  const clearSelection = useCallback(() => setSelection(null), []);

  const confirmMove = useCallback(() => {
    if (!uid || !room || !isMyTurn || !selection || isRoomExpired(room)) return;
    submitNimMove(code, uid, selection.pileIndex, selection.tokensRemoved).catch((error) =>
      console.warn("submitNimMove", error),
    );
    setSelection(null);
  }, [uid, room, code, isMyTurn, selection]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetNimRoomForRematch(code))
      .catch((error) => console.warn("nim playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    isMyTurn,
    selection,
    selectToken,
    clearSelection,
    confirmMove,
    playAgain,
    leave,
  };
}
