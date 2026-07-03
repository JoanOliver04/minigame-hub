"use client";

/**
 * Neon Drift room hook — runs a LOCAL time-attack race on the shared track and
 * reports the finish time. Mirrors useNeonDrift's player-side engine — the
 * fixed-step physics loop over requestAnimationFrame, the 3-2-1 countdown,
 * keyboard/pad input — but with NO AI car (the opponent is a remote human) and
 * reporting out instead of recording to ScoresContext. The match resolves like
 * RPS once both finish times are in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { initialCar, stepCar } from "./physics";
import { getTrack, type TrackDef } from "./tracks";
import type { CarState, ControlInput } from "./types";
import { FIXED_DT, MAX_FRAME_DELTA } from "./types";
import {
  resetDriftRoomForRematch,
  resolveDriftIfReady,
  submitDriftTime,
  type DriftRoomGame,
} from "./room";

export type DriftRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export type LocalRace = "ready" | "racing" | "submitted";

const COUNTDOWN_S = 3;
const NEUTRAL_INPUT: ControlInput = { steer: 0, throttle: 1, brake: 0, boost: false };

export interface UseDriftRoomResult {
  uid: string | null;
  room: RoomDoc<DriftRoomGame> | null;
  stage: DriftRoomStage;
  localRace: LocalRace;
  car: CarState | null;
  raceTime: number;
  countdown: number;
  track: TrackDef;
  start: () => void;
  setInput: (partial: Partial<ControlInput>) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useDriftRoom(code: string): UseDriftRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<DriftRoomGame> | null>(null);
  const [stage, setStage] = useState<DriftRoomStage>("connecting");
  const [localRace, setLocalRace] = useState<LocalRace>("ready");
  const [car, setCar] = useState<CarState | null>(null);
  const [raceTime, setRaceTime] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_S);
  const [track, setTrack] = useState<TrackDef>(() => getTrack("circuit"));

  const carRef = useRef<CarState | null>(null);
  const inputRef = useRef<ControlInput>({ ...NEUTRAL_INPUT });
  const trackRef = useRef<TrackDef>(getTrack("circuit"));
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const accRef = useRef(0);
  const raceTimeRef = useRef(0);
  const loopRef = useRef<(ts: number) => void>(() => {});
  const submittedRef = useRef(false);
  const seededRef = useRef<string | null>(null);
  const resolvingRef = useRef(false);
  const uidRef = useRef<string | null>(null);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        uidRef.current = user.uid;
        unsubscribe = subscribeRoom<DriftRoomGame>(
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

  const finish = useCallback((finished: CarState) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLocalRace("submitted");
    if (!submittedRef.current && uidRef.current) {
      submittedRef.current = true;
      submitDriftTime(codeRef.current, uidRef.current, finished.finishTime ?? raceTimeRef.current).catch(
        (error) => console.warn("submitDriftTime", error),
      );
    }
  }, []);

  const loop = useCallback(
    (ts: number) => {
      const trk = trackRef.current;
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const frameDelta = Math.min(MAX_FRAME_DELTA, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (raceTimeRef.current < 0) {
        raceTimeRef.current += frameDelta;
        setCountdown(Math.max(0, Math.ceil(-raceTimeRef.current)));
        if (raceTimeRef.current >= 0) {
          raceTimeRef.current = 0;
          setCountdown(0);
        }
        rafRef.current = requestAnimationFrame((next) => loopRef.current(next));
        return;
      }

      accRef.current += frameDelta;
      let c = carRef.current!;
      while (accRef.current >= FIXED_DT) {
        c = stepCar(c, inputRef.current, trk, raceTimeRef.current);
        raceTimeRef.current += FIXED_DT;
        accRef.current -= FIXED_DT;
      }
      carRef.current = c;
      setCar(c);
      setRaceTime(raceTimeRef.current);

      if (c.finished) {
        finish(c);
        return;
      }
      rafRef.current = requestAnimationFrame((next) => loopRef.current(next));
    },
    [finish],
  );

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  // Reset to the ready screen when a brand-new race is dealt (rematch).
  useEffect(() => {
    if (!room || room.status !== "playing" || !uid) return;
    const allNull = Object.values(room.game.results).every((r) => !r);
    if (allNull && submittedRef.current) {
      submittedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setLocalRace("ready");
      setCar(null);
      setRaceTime(0);
      setCountdown(COUNTDOWN_S);
    }
  }, [room, uid]);

  const start = useCallback(() => {
    if (localRace !== "ready" || !room) return;
    const trk = getTrack(room.game.trackId);
    trackRef.current = trk;
    setTrack(trk);
    const c = initialCar(trk);
    carRef.current = c;
    inputRef.current = { ...NEUTRAL_INPUT };
    submittedRef.current = false;
    seededRef.current = "started";
    setCar(c);
    setRaceTime(0);
    setCountdown(COUNTDOWN_S);
    lastTsRef.current = 0;
    accRef.current = 0;
    raceTimeRef.current = -COUNTDOWN_S;
    setLocalRace("racing");
    rafRef.current = requestAnimationFrame((ts) => loopRef.current(ts));
  }, [localRace, room]);

  const setInput = useCallback((partial: Partial<ControlInput>) => {
    inputRef.current = { ...inputRef.current, ...partial };
  }, []);

  // Keyboard: steer/brake/boost (throttle auto-held), same as solo.
  useEffect(() => {
    if (localRace !== "racing") return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") setInput({ steer: -1 });
      else if (k === "arrowright" || k === "d") setInput({ steer: 1 });
      else if (k === "arrowdown" || k === "s") setInput({ brake: 1 });
      else if (k === " ") setInput({ boost: true });
      else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d") setInput({ steer: 0 });
      else if (k === "arrowdown" || k === "s") setInput({ brake: 0 });
      else if (k === " ") setInput({ boost: false });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [localRace, setInput]);

  // Resolve once both finish times are in (idempotent for the loser).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.results);
    if (uids.length !== 2 || !uids.every((id) => room.game.results[id])) return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    resolveDriftIfReady(code)
      .catch((error) => console.warn("resolveDriftIfReady", error))
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [room, code]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetDriftRoomForRematch(code))
      .catch((error) => console.warn("drift playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    localRace,
    car,
    raceTime,
    countdown,
    track,
    start,
    setInput,
    playAgain,
    leave,
  };
}
