"use client";

/**
 * Fleet Command room hook — sibling to useFleetCommand.ts, backed by Firestore
 * instead of the placement-heatmap AI. Two-player Battleship: a placement
 * phase (shuffle + ready) then strictly turn-based firing. Same soft-expiry
 * story and same deliberate omission of ScoresContext.record() as the other
 * room hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { createRng, randomSeed } from "@/lib/rng";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { randomFleet } from "./logic";
import {
  fireShot,
  placeFleet,
  readyFleet,
  resetFleetRoomForRematch,
  type FleetRoomGame,
} from "./room";

export type FleetRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export interface UseFleetRoomResult {
  uid: string | null;
  room: RoomDoc<FleetRoomGame> | null;
  stage: FleetRoomStage;
  isMyTurn: boolean;
  shuffle: () => void;
  ready: () => void;
  fire: (index: number) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useFleetRoom(code: string): UseFleetRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<FleetRoomGame> | null>(null);
  const [stage, setStage] = useState<FleetRoomStage>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<FleetRoomGame>(
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

  const shuffle = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    if (room.game.phase !== "placing" || room.game.ready[uid]) return;
    placeFleet(code, uid, randomFleet(createRng(randomSeed()))).catch((error) =>
      console.warn("placeFleet", error),
    );
  }, [uid, room, code]);

  const ready = useCallback(() => {
    if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
    if (room.game.phase !== "placing") return;
    readyFleet(code, uid).catch((error) => console.warn("readyFleet", error));
  }, [uid, room, code]);

  const fire = useCallback(
    (index: number) => {
      if (!uid || !room || room.status !== "playing" || isRoomExpired(room)) return;
      const g = room.game;
      if (g.phase !== "firing" || g.finished || g.turn !== uid) return;
      fireShot(code, uid, index).catch((error) => console.warn("fireShot", error));
    },
    [uid, room, code],
  );

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetFleetRoomForRematch(code))
      .catch((error) => console.warn("fleet playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const isMyTurn = Boolean(uid && room?.game.turn === uid);

  return { uid, room, stage, isMyTurn, shuffle, ready, fire, playAgain, leave };
}
