"use client";

/**
 * TTT room hook — sibling to useTttGame.ts, backed by Firestore instead of
 * a local AI. Unlike RPS there's no separate "resolve" step: the moving
 * player's own transaction (submitTttMove) fully applies the result, since
 * TTT is strictly turn-based rather than simultaneous. Deliberately does
 * NOT call ScoresContext.record() — see useRpsRoom.ts for why. Same soft
 * expiry story as useRpsRoom.ts: no Firestore TTL policy, expiry enforced
 * by firestore.rules' `notExpired()` plus the guards below.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import type { TttMove } from "./logic";
import { resetTttRoomForRematch, submitTttMove, type TttRoomGame } from "./room";

export type TttRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseTttRoomResult {
  uid: string | null;
  room: RoomDoc<TttRoomGame> | null;
  stage: TttRoomStage;
  selectedCell: number | null;
  handleCell: (cell: number) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useTttRoom(code: string): UseTttRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<TttRoomGame> | null>(null);
  const [stage, setStage] = useState<TttRoomStage>("connecting");
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const lastTurnRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<TttRoomGame>(
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

  // Drop a stale selection whenever the turn changes (mine ended, or the
  // board reset for a new round) — the previous selected cell no longer
  // means anything on a fresh/changed board.
  useEffect(() => {
    const turn = room?.game.turn ?? null;
    if (turn !== lastTurnRef.current) {
      lastTurnRef.current = turn;
      setSelectedCell(null);
    }
  }, [room?.game.turn]);

  const handleCell = useCallback(
    (cell: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.turn !== uid) return;
      const myMark = g.marks[uid];
      if (!myMark) return;

      const myCells = g.board.filter((value) => value === myMark).length;
      if (myCells === 3) {
        if (g.board[cell] === myMark) {
          setSelectedCell(cell);
          return;
        }
        if (g.board[cell] !== null || selectedCell === null) return;
        const move: TttMove = { from: selectedCell, to: cell };
        setSelectedCell(null);
        submitTttMove(code, uid, move).catch((error) => console.warn("submitTttMove", error));
        return;
      }

      if (g.board[cell] !== null) return;
      submitTttMove(code, uid, { from: null, to: cell }).catch((error) =>
        console.warn("submitTttMove", error),
      );
    },
    [uid, room, code, selectedCell],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetTttRoomForRematch(code))
      .catch((error) => console.warn("ttt playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, selectedCell, handleCell, playAgain, leave };
}
