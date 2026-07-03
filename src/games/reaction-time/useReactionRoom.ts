"use client";

/**
 * Reaction Time room hook — sibling to useReactionTime.ts, backed by Firestore
 * instead of a simulated AI. Simultaneous-move like RPS: each client runs the
 * SAME shared `delayMs` on its own local timer, measures its own reaction, and
 * writes a blind result; either client then resolves the round (idempotent).
 * Same soft-expiry story and same deliberate omission of ScoresContext.record()
 * as the other room hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { GET_READY_MS, preciseNow } from "./logic";
import {
  resetReactionRoomForRematch,
  resolveReactionRoundIfReady,
  submitReaction,
  type ReactionRoomGame,
} from "./room";

/** Local per-round stage, driven by this client's own timers (not Firestore). */
export type LocalStage = "waiting" | "ready" | "go" | "submitted";

export type ReactionRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseReactionRoomResult {
  uid: string | null;
  room: RoomDoc<ReactionRoomGame> | null;
  stage: ReactionRoomStage;
  localStage: LocalStage;
  bothIn: boolean;
  tap: () => void;
  playAgain: () => void;
  leave: () => void;
}

export function useReactionRoom(code: string): UseReactionRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ReactionRoomGame> | null>(null);
  const [stage, setStage] = useState<ReactionRoomStage>("connecting");
  const [localStage, setLocalStage] = useState<LocalStage>("waiting");
  const goTimeRef = useRef<number>(0);
  const armedRoundRef = useRef<number>(0);
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<ReactionRoomGame>(
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

  // Arm this client's local timers whenever a new round begins. A brief
  // "waiting" grace beat (GET_READY_MS) precedes the armed "ready" window so a
  // leftover tap can't be misread as a false start; then GO fires after the
  // round's shared delay.
  useEffect(() => {
    if (!room || room.status !== "playing" || !uid) return;
    const g = room.game;
    if (g.pending[uid]) return; // already submitted this round
    if (armedRoundRef.current === g.roundId) return; // timers already running
    armedRoundRef.current = g.roundId;

    setLocalStage("waiting");
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        setLocalStage("ready");
        timers.push(
          setTimeout(() => {
            goTimeRef.current = preciseNow();
            setLocalStage("go");
          }, g.delayMs),
        );
      }, GET_READY_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [room, uid]);

  // Either client resolves once both results are in (idempotent no-op for the loser).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.pending);
    if (uids.length !== 2) return;
    if (uids.every((id) => room.game.pending[id]) && !resolvingRef.current) {
      resolvingRef.current = true;
      resolveReactionRoundIfReady(code)
        .catch((error) => console.warn("resolveReactionRoundIfReady", error))
        .finally(() => {
          resolvingRef.current = false;
        });
    }
  }, [room, code]);

  const tap = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    if (room.game.pending[uid]) return;
    if (localStage === "ready") {
      setLocalStage("submitted");
      submitReaction(code, uid, { reactionMs: null, falseStart: true }).catch((error) =>
        console.warn("submitReaction", error),
      );
    } else if (localStage === "go") {
      const reactionMs = Math.round(preciseNow() - goTimeRef.current);
      setLocalStage("submitted");
      submitReaction(code, uid, { reactionMs, falseStart: false }).catch((error) =>
        console.warn("submitReaction", error),
      );
    }
    // "waiting"/"submitted": ignore.
  }, [uid, room, code, localStage]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetReactionRoomForRematch(code))
      .catch((error) => console.warn("reaction playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const bothIn = Boolean(
    room && Object.keys(room.game.pending).every((id) => room.game.pending[id]),
  );

  return { uid, room, stage, localStage, bothIn, tap, playAgain, leave };
}
