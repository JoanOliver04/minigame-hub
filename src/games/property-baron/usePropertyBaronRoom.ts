"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  buyPropertyBaronRoom,
  passPropertyBaronRoom,
  resetPropertyBaronRoomForRematch,
  rollPropertyBaronRoom,
  upgradePropertyBaronRoom,
  type PropertyBaronRoomGame,
} from "./room";

export type PropertyBaronRoomStage = "connecting" | "waiting" | "playing" | "finished" | "gone" | "expired" | "error";

export function usePropertyBaronRoom(code: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<PropertyBaronRoomGame> | null>(null);
  const [stage, setStage] = useState<PropertyBaronRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<PropertyBaronRoomGame>(
          code,
          (doc) => {
            setRoom(doc);
            if (!doc) return setStage("gone");
            if (isRoomExpired(doc)) return setStage("expired");
            if (doc.status === "abandoned") return setStage("gone");
            return setStage(doc.status);
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

  const roll = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    rollPropertyBaronRoom(code, uid).catch((error) => console.warn("rollPropertyBaronRoom", error));
  }, [uid, room, code]);

  const buy = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    buyPropertyBaronRoom(code, uid).catch((error) => console.warn("buyPropertyBaronRoom", error));
  }, [uid, room, code]);

  const upgrade = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    upgradePropertyBaronRoom(code, uid).catch((error) => console.warn("upgradePropertyBaronRoom", error));
  }, [uid, room, code]);

  const pass = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    passPropertyBaronRoom(code, uid).catch((error) => console.warn("passPropertyBaronRoom", error));
  }, [uid, room, code]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetPropertyBaronRoomForRematch(code))
      .catch((error) => console.warn("propertyBaron playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, roll, buy, upgrade, pass, playAgain, leave };
}
