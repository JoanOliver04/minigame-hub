"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  resetBasketRoomForRematch,
  resolveBasketRoomIfReady,
  submitBasketRoomResult,
  type BasketRoomGame,
  type BasketRoomResult,
} from "./room";

export type BasketRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export function useBasketRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<BasketRoomGame> | null>(null);
  const [stage, setStage] = useState<BasketRoomStage>("connecting");
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<BasketRoomGame>(
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
    resolveBasketRoomIfReady(code)
      .catch((error) => console.warn("resolveBasketRoomIfReady", error))
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [code, room]);

  const submit = useCallback(
    (result: BasketRoomResult) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      if (room.game.results[uid]) return;
      submitBasketRoomResult(code, uid, result).catch((error) =>
        console.warn("submitBasketRoomResult", error),
      );
    },
    [code, room, uid],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetBasketRoomForRematch(code))
      .catch((error) => console.warn("basket playAgain", error));
  }, [code, room, uid]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, submit, playAgain, leave };
}
