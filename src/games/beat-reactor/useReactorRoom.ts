"use client";

/**
 * Beat Reactor room hook — runs a LOCAL performance of the shared chart
 * (seeded from the room) and reports the final score. Mirrors useBeatReactor's
 * player-side engine — the Web Audio clock, the requestAnimationFrame loop for
 * note rendering + auto-miss sweeping, keyboard/lane input — but with NO AI
 * runner (the opponent is a remote human) and reporting out instead of
 * recording to ScoresContext. The match resolves like RPS once both scores are in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { createRng } from "@/lib/rng";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { ReactorAudio } from "./audio";
import { generateChart } from "./generation";
import { collectAutoMisses, comboMultiplier, findTarget, hitScore, judge } from "./logic";
import type { BeatEvent, Judgement, Lane } from "./types";
import { LANE_KEYS } from "./types";
import {
  resetReactorRoomForRematch,
  resolveReactorIfReady,
  submitReactorScore,
  type ReactorRoomGame,
} from "./room";

export type ReactorRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

/** Local performance state, separate from the room's coarse status. */
export type LocalPlay = "ready" | "playing" | "submitted";

interface LaneFlash {
  lane: Lane;
  judgement: Judgement;
  key: number;
}

export interface UseReactorRoomResult {
  uid: string | null;
  room: RoomDoc<ReactorRoomGame> | null;
  stage: ReactorRoomStage;
  localPlay: LocalPlay;
  events: BeatEvent[];
  nowTime: number;
  score: number;
  combo: number;
  comboMult: (combo: number) => number;
  flash: LaneFlash | null;
  muted: boolean;
  setMuted: (m: boolean) => void;
  start: () => void;
  hitLane: (lane: Lane) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useReactorRoom(code: string): UseReactorRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ReactorRoomGame> | null>(null);
  const [stage, setStage] = useState<ReactorRoomStage>("connecting");
  const [localPlay, setLocalPlay] = useState<LocalPlay>("ready");
  const [events, setEvents] = useState<BeatEvent[]>([]);
  const [nowTime, setNowTime] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<LaneFlash | null>(null);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef<ReactorAudio | null>(null);
  const rafRef = useRef<number | null>(null);
  const eventsRef = useRef<BeatEvent[]>([]);
  const resolvedRef = useRef<Set<number>>(new Set());
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const flashKeyRef = useRef(0);
  const seededRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const resolvingRef = useRef(false);
  const loopRef = useRef<() => void>(() => {});
  const uidRef = useRef<string | null>(null);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    audioRef.current = new ReactorAudio();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      audioRef.current?.dispose();
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
        unsubscribe = subscribeRoom<ReactorRoomGame>(
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

  const finish = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLocalPlay("submitted");
    if (!submittedRef.current && uidRef.current) {
      submittedRef.current = true;
      submitReactorScore(codeRef.current, uidRef.current, scoreRef.current).catch((error) =>
        console.warn("submitReactorScore", error),
      );
    }
  }, []);

  const loop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    setNowTime(t);

    const misses = collectAutoMisses(eventsRef.current, resolvedRef.current, t);
    if (misses.length > 0) {
      for (const event of misses) resolvedRef.current.add(event.id);
      comboRef.current = 0;
      setCombo(0);
    }

    const lastEvent = eventsRef.current[eventsRef.current.length - 1];
    const songEndTime = lastEvent ? lastEvent.hitTime + 0.6 : 0;
    if (t >= songEndTime && eventsRef.current.length > 0) {
      finish();
      return;
    }
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  }, [finish]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  // Reset local performance whenever a new chart (seed) arrives.
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    if (seededRef.current === room.game.seed) return;
    seededRef.current = room.game.seed;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    submittedRef.current = false;
    resolvedRef.current = new Set();
    scoreRef.current = 0;
    comboRef.current = 0;
    setScore(0);
    setCombo(0);
    setFlash(null);
    setNowTime(0);
    setEvents([]);
    setLocalPlay("ready");
  }, [room]);

  const start = useCallback(() => {
    const g = room?.game;
    if (!g || localPlay !== "ready") return;
    const audio = audioRef.current ?? new ReactorAudio();
    audioRef.current = audio;
    audio.ensureStarted();

    const chart = generateChart(
      { seed: g.seed, bpm: g.bpm, bars: g.bars, density: g.density },
      createRng(g.seed),
    );
    eventsRef.current = chart;
    setEvents(chart);
    resolvedRef.current = new Set();
    scoreRef.current = 0;
    comboRef.current = 0;
    setScore(0);
    setCombo(0);
    setLocalPlay("playing");
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  }, [room, localPlay]);

  const hitLane = useCallback(
    (lane: Lane) => {
      const audio = audioRef.current;
      if (!audio || localPlay !== "playing") return;
      const t = audio.currentTime;
      const target = findTarget(eventsRef.current, resolvedRef.current, lane, t);
      audio.playLaneTone(lane, false, muted);
      if (!target) return;
      resolvedRef.current.add(target.id);
      const j = judge((t - target.hitTime) * 1000);
      if (!muted) audio.playFeedback(j);
      const gained = hitScore(j, comboRef.current);
      const nextCombo = j === "miss" ? 0 : comboRef.current + 1;
      comboRef.current = nextCombo;
      scoreRef.current += gained;
      setScore(scoreRef.current);
      setCombo(nextCombo);
      flashKeyRef.current += 1;
      setFlash({ lane, judgement: j, key: flashKeyRef.current });
    },
    [localPlay, muted],
  );

  useEffect(() => {
    if (localPlay !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toLowerCase() as (typeof LANE_KEYS)[number]);
      if (idx !== -1) {
        e.preventDefault();
        hitLane(idx as Lane);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [localPlay, hitLane]);

  // Resolve once both scores are in (idempotent for the loser).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.results);
    if (uids.length !== 2 || !uids.every((id) => room.game.results[id])) return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    resolveReactorIfReady(code)
      .catch((error) => console.warn("resolveReactorIfReady", error))
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [room, code]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetReactorRoomForRematch(code))
      .catch((error) => console.warn("reactor playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  return {
    uid,
    room,
    stage,
    localPlay,
    events,
    nowTime,
    score,
    combo,
    comboMult: comboMultiplier,
    flash,
    muted,
    setMuted,
    start,
    hitLane,
    playAgain,
    leave,
  };
}
