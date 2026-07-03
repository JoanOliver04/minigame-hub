"use client";

/**
 * Signal Breaker room hook — sibling to useSignalBreaker.ts, backed by
 * Firestore instead of a solver AI. Self-paced duel: each player builds and
 * submits guesses against their opponent's code at their own pace; the match
 * resolves server-side once both are done. Local `draft` holds the 4-symbol
 * guess being built. Same soft-expiry story and same deliberate omission of
 * ScoresContext.record() as the other room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { CODE_LENGTH, SYMBOL_COUNT } from "./types";
import { resetSignalRoomForRematch, submitSignalGuess, type SignalRoomGame } from "./room";

export type SignalRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

const EMPTY_DRAFT = Array.from({ length: CODE_LENGTH }, () => null as number | null);

export interface UseSignalRoomResult {
  uid: string | null;
  room: RoomDoc<SignalRoomGame> | null;
  stage: SignalRoomStage;
  draft: (number | null)[];
  setDraftSlot: (index: number, symbol: number) => void;
  cycleSlot: (index: number) => void;
  clearDraft: () => void;
  submit: () => void;
  playAgain: () => void;
  leave: () => void;
}

export function useSignalRoom(code: string): UseSignalRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<SignalRoomGame> | null>(null);
  const [stage, setStage] = useState<SignalRoomStage>("connecting");
  const [draft, setDraft] = useState<(number | null)[]>([...EMPTY_DRAFT]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<SignalRoomGame>(
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

  const setDraftSlot = useCallback((index: number, symbol: number) => {
    setDraft((prev) => prev.map((v, i) => (i === index ? symbol : v)));
  }, []);

  const cycleSlot = useCallback((index: number) => {
    setDraft((prev) => prev.map((v, i) => (i === index ? ((v === null ? 0 : (v + 1) % SYMBOL_COUNT)) : v)));
  }, []);

  const clearDraft = useCallback(() => setDraft([...EMPTY_DRAFT]), []);

  const submit = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    if (room.game.done[uid]) return;
    if (draft.some((d) => d === null)) return;
    submitSignalGuess(code, uid, draft as number[])
      .then(() => setDraft([...EMPTY_DRAFT]))
      .catch((error) => console.warn("submitSignalGuess", error));
  }, [uid, room, code, draft]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetSignalRoomForRematch(code))
      .catch((error) => console.warn("signal playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, draft, setDraftSlot, cycleSlot, clearDraft, submit, playAgain, leave };
}
