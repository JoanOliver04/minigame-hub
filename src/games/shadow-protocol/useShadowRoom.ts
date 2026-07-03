"use client";

/**
 * Shadow Protocol room hook — runs a LOCAL solo infiltration seeded from the
 * room's shared `seed`, reusing the whole pure engine (createShadowMatch /
 * applyAction / computeScore). The room is otherwise just two synced touch
 * points: the shared seed at the start and each player's final result at the
 * end (submitted blind, resolved like RPS). Mirrors useShadowProtocol's local
 * play (moves, sprint/beacon arming, keyboard) but reports out instead of
 * recording to ScoresContext.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { createRng } from "@/lib/rng";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { leaveRoom, subscribeRoom, voteRematch } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import {
  applyAction,
  beaconTargets,
  computeScore,
  createShadowMatch,
  hackTargets,
} from "./logic";
import type { Dir, PlayerAction, Position, ShadowState } from "./types";
import { samePos } from "./types";
import {
  resetShadowRoomForRematch,
  resolveShadowIfReady,
  submitShadowResult,
  type ShadowRoomGame,
} from "./room";

export type ShadowRoomStage =
  | "connecting"
  | "waiting"
  | "playing"
  | "finished"
  | "gone"
  | "expired"
  | "error";

export type ArmedMode = "none" | "sprint" | "beacon";

export interface UseShadowRoomResult {
  uid: string | null;
  room: RoomDoc<ShadowRoomGame> | null;
  stage: ShadowRoomStage;
  local: ShadowState | null;
  armed: ArmedMode;
  setArmed: (mode: ArmedMode) => void;
  submitted: boolean;
  hackAvailable: boolean;
  beaconSpots: Position[];
  tapTile: (pos: Position) => void;
  act: (action: PlayerAction) => void;
  playAgain: () => void;
  leave: () => void;
}

export function useShadowRoom(code: string): UseShadowRoomResult {
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc<ShadowRoomGame> | null>(null);
  const [stage, setStage] = useState<ShadowRoomStage>("connecting");
  const [local, setLocal] = useState<ShadowState | null>(null);
  const [armed, setArmed] = useState<ArmedMode>("none");
  const [submitted, setSubmitted] = useState(false);
  const seededRef = useRef<number | null>(null);
  const resolvingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<ShadowRoomGame>(
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

  // Build the local run once per seed (a new seed = new match / rematch).
  useEffect(() => {
    if (!room || room.status !== "playing" || !uid) return;
    const g = room.game;
    if (g.results[uid]) return; // already finished this run
    if (seededRef.current === g.seed) return;
    seededRef.current = g.seed;
    setLocal(createShadowMatch(g.difficulty, createRng(g.seed)));
    setArmed("none");
    setSubmitted(false);
  }, [room, uid]);

  const act = useCallback(
    (action: PlayerAction) => {
      if (!uid || !local || local.status !== "playing" || submitted) return;
      const { state: next, events } = applyAction(local, action);
      if (next === local) return; // illegal move
      setArmed("none");
      setLocal(next);

      const done =
        events.includes("escaped") || events.includes("caught") || events.includes("alarm-zero");
      if (done) {
        setSubmitted(true);
        const escaped = next.status === "won";
        submitShadowResult(code, uid, {
          escaped,
          score: escaped ? computeScore(next).total : 0,
          turns: next.turn,
        }).catch((error) => console.warn("submitShadowResult", error));
      }
    },
    [uid, local, submitted, code],
  );

  const tapTile = useCallback(
    (pos: Position) => {
      if (!local || local.status !== "playing") return;
      if (armed === "beacon") {
        if (beaconTargets(local).some((p) => samePos(p, pos))) act({ kind: "beacon", target: pos });
        return;
      }
      const dx = pos.x - local.player.x;
      const dy = pos.y - local.player.y;
      const dir: Dir | null =
        dx === 0 && dy < 0 ? "n" : dx === 0 && dy > 0 ? "s" : dy === 0 && dx > 0 ? "e" : dy === 0 && dx < 0 ? "w" : null;
      if (!dir) return;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist === 1) act({ kind: armed === "sprint" ? "sprint" : "move", dir });
      else if (dist === 2 && armed === "sprint") act({ kind: "sprint", dir });
    },
    [act, armed, local],
  );

  // Keyboard: arrows/WASD move, Shift sprint, B beacon, H hack, Space wait.
  useEffect(() => {
    if (!local || local.status !== "playing" || submitted) return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const dir: Dir | null =
        key === "arrowup" || key === "w" ? "n"
          : key === "arrowdown" || key === "s" ? "s"
            : key === "arrowleft" || key === "a" ? "w"
              : key === "arrowright" || key === "d" ? "e" : null;
      if (dir) {
        event.preventDefault();
        act({ kind: armed === "sprint" ? "sprint" : "move", dir });
      } else if (key === " ") {
        event.preventDefault();
        act({ kind: "wait" });
      } else if (key === "h") {
        act({ kind: "hack" });
      } else if (key === "shift") {
        setArmed((prev) => (prev === "sprint" ? "none" : "sprint"));
      } else if (key === "b") {
        setArmed((prev) => (prev === "beacon" ? "none" : "beacon"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [local, submitted, armed, act]);

  // Resolve the match once both results are in (idempotent for the loser).
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const uids = Object.keys(room.game.results);
    if (uids.length !== 2 || !uids.every((id) => room.game.results[id])) return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    resolveShadowIfReady(code)
      .catch((error) => console.warn("resolveShadowIfReady", error))
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [room, code]);

  const playAgain = useCallback(() => {
    if (!uid || !room || isRoomExpired(room)) return;
    voteRematch(code, uid)
      .then(() => resetShadowRoomForRematch(code))
      .catch((error) => console.warn("shadow playAgain", error));
  }, [uid, room, code]);

  const leave = useCallback(() => {
    leaveRoom(code).catch((error) => console.warn("leaveRoom", error));
  }, [code]);

  const iSubmitted = submitted || Boolean(uid && room?.game.results[uid]);

  return {
    uid,
    room,
    stage,
    local,
    armed,
    setArmed,
    submitted: iSubmitted,
    hackAvailable: local ? hackTargets(local).length > 0 : false,
    beaconSpots: local && armed === "beacon" ? beaconTargets(local) : [],
    tapTile,
    act,
    playAgain,
    leave,
  };
}
