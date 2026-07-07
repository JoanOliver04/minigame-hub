"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  resetPenaltyRoomForRematch,
  resolvePenaltyRoomIfReady,
  submitPenaltyRoomResult,
  type PenaltyRoomGame,
  type PenaltyRoomResult,
} from "./room";

export type PenaltyRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export function usePenaltyRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<PenaltyRoomGame> | null>(null);
  const [stage, setStage] = useState<PenaltyRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<PenaltyRoomGame>(
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

  useEffect(() => {
    if (!room || room.status !== "playing" || resolvingRef.current) return;
    const results = Object.values(room.game.results);
    if (results.length !== 2 || !results.every(Boolean)) return;
    resolvingRef.current = true;
    resolvePenaltyRoomIfReady(code)
      .catch((error) => console.warn("resolvePenaltyRoomIfReady", error))
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [code, room]);

  const submit = useCallback(
    (result: PenaltyRoomResult) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      if (room.game.results[uid]) return;
      submitPenaltyRoomResult(code, uid, result).catch((error) =>
        console.warn("submitPenaltyRoomResult", error),
      );
    },
    [code, room, uid],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetPenaltyRoomForRematch(code))
      .catch((error) => console.warn("penalty playAgain", error));
  }, [code, room, uid]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, submit, playAgain, leave };
}
