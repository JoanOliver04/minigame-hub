"use client";

/**
 * Diceforge Arena room hook — sibling to useDiceforgeArena.ts, backed by
 * Firestore instead of a scripted AI. Both players act each phase (lock, shop)
 * and the transaction advances once both have. Same soft-expiry story and same
 * deliberate omission of ScoresContext.record() as the other room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import type { Offer } from "./types";
import {
  buyForgeUpgrade,
  lockAndReroll,
  resetForgeRoomForRematch,
  skipForgeShop,
  type ForgeRoomGame,
} from "./room";

export type ForgeRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseForgeRoomResult {
  uid: string | null;
  room: RoomDoc<ForgeRoomGame> | null;
  stage: ForgeRoomStage;
  lock: (dieIndex: number) => void;
  buy: (offer: Offer, dieIndex: number, faceIndex: number) => void;
  skip: () => void;
  playAgain: () => void;
  leave: () => void;
}

export function useForgeRoom(code: string): UseForgeRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ForgeRoomGame> | null>(null);
  const [stage, setStage] = useState<ForgeRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<ForgeRoomGame>(
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

  const lock = useCallback(
    (dieIndex: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.stage !== "lock" || g.locked[uid] !== null) return;
      lockAndReroll(code, uid, dieIndex).catch((error) => console.warn("lockAndReroll", error));
    },
    [uid, room, code],
  );

  const buy = useCallback(
    (offer: Offer, dieIndex: number, faceIndex: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.finished || g.stage !== "shop" || g.shopDone[uid]) return;
      buyForgeUpgrade(code, uid, offer, dieIndex, faceIndex).catch((error) =>
        console.warn("buyForgeUpgrade", error),
      );
    },
    [uid, room, code],
  );

  const skip = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    const g = room.game;
    if (g.finished || g.stage !== "shop" || g.shopDone[uid]) return;
    skipForgeShop(code, uid).catch((error) => console.warn("skipForgeShop", error));
  }, [uid, room, code]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetForgeRoomForRematch(code))
      .catch((error) => console.warn("forge playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return { uid, room, stage, lock, buy, skip, playAgain, leave };
}
