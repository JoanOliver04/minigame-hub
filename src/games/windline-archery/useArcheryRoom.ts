"use client";

/**
 * Windline Archery room hook — sibling to useWindlineArchery.ts, backed by
 * Firestore instead of a simulated AI archer. Simultaneous-move like RPS: both
 * players aim against the same public wind and loose blind; either client
 * resolves the end once both arrows are in. The oscillating release meter runs
 * locally (same as solo) and produces the submitted releaseError. Same
 * soft-expiry story and same deliberate omission of ScoresContext.record().
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  resetArcheryRoomForRematch,
  resolveArcheryEndIfReady,
  submitArrow,
  type ArcheryRoomGame,
} from "./room";

const METER_TICK_MS = 30;
const METER_SPEED = 0.11;
const RELEASE_ERROR_SCALE = 0.6;

export type ArcheryRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export type LocalAimStage = "aim" | "meter" | "submitted";

export interface UseArcheryRoomResult {
  uid: string | null;
  room: RoomDoc<ArcheryRoomGame> | null;
  stage: ArcheryRoomStage;
  aimStage: LocalAimStage;
  angle: number;
  windage: number;
  power: number;
  meterValue: number;
  setAngle: (v: number) => void;
  setWindage: (v: number) => void;
  setPower: (v: number) => void;
  draw: () => void;
  release: () => void;
  playAgain: () => void;
  leave: () => void;
}

export function useArcheryRoom(code: string): UseArcheryRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ArcheryRoomGame> | null>(null);
  const [stage, setStage] = useState<ArcheryRoomStage>("connecting");
  const [aimStage, setAimStage] = useState<LocalAimStage>("aim");
  const [angle, setAngle] = useState(10);
  const [windage, setWindage] = useState(0);
  const [power, setPower] = useState(60);
  const [meterValue, setMeterValue] = useState(0);

  const meterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meterPhaseRef = useRef(0);
  const resolvingRef = useRef(false);
  const lastEndRef = useRef(0);

  const stopMeter = useCallback(() => {
    if (meterTimerRef.current) {
      clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<ArcheryRoomGame>(
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
      stopMeter();
    };
  }, [code, stopMeter]);

  // Reset local aim at the start of each new end.
  useEffect(() => {
    const endIndex = room?.game.endIndex ?? 0;
    if (endIndex !== lastEndRef.current) {
      lastEndRef.current = endIndex;
      stopMeter();
      setAimStage("aim");
      setAngle(10);
      setWindage(0);
      setPower(60);
      setMeterValue(0);
    }
  }, [room?.game.endIndex, stopMeter]);

  // Either client resolves the end once both arrows are in.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.pending);
    if (uids.length !== 2) return;
    if (uids.every((id) => room.game.pending[id]) && !resolvingRef.current) {
      resolvingRef.current = true;
      resolveArcheryEndIfReady(code)
        .catch((error) => console.warn("resolveArcheryEndIfReady", error))
        .finally(() => {
          resolvingRef.current = false;
        });
    }
  }, [room, code]);

  const draw = useCallback(() => {
    if (aimStage !== "aim") return;
    setAimStage("meter");
    meterPhaseRef.current = 0;
    setMeterValue(0);
    stopMeter();
    meterTimerRef.current = setInterval(() => {
      meterPhaseRef.current += METER_SPEED;
      setMeterValue(Math.sin(meterPhaseRef.current));
    }, METER_TICK_MS);
  }, [aimStage, stopMeter]);

  const release = useCallback(() => {
    if (!uid || !room || aimStage !== "meter" || isRoomExpired(room)) return;
    stopMeter();
    const releaseError = Math.sin(meterPhaseRef.current) * RELEASE_ERROR_SCALE;
    setAimStage("submitted");
    submitArrow(code, uid, { angleDeg: angle, windageDeg: windage, power, releaseError }).catch((error) =>
      console.warn("submitArrow", error),
    );
  }, [uid, room, aimStage, angle, windage, power, code, stopMeter]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetArcheryRoomForRematch(code))
      .catch((error) => console.warn("archery playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    aimStage,
    angle,
    windage,
    power,
    meterValue,
    setAngle,
    setWindage,
    setPower,
    draw,
    release,
    playAgain,
    leave,
  };
}
