"use client";

/**
 * Dispatches a room code to the right game's RoomComponent (see
 * src/games/roomRegistry.ts), and handles the "I have a link but haven't
 * joined yet" path: auto-joins using the locally remembered player name,
 * or asks for one if this is the first time on this device.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { joinRoom, subscribeRoom } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { usePlayerName } from "@/lib/rooms/usePlayerName";
import { getRoomGame } from "@/games/roomRegistry";

type ClientPhase = "connecting" | "not-found" | "error" | "ready";

export function RoomClient({ code }: { code: string }) {
  const { t } = useLocale();
  const [name, setName] = usePlayerName();
  const [nameDraft, setNameDraft] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [phase, setPhase] = useState<ClientPhase>("connecting");
  const [joining, setJoining] = useState(false);
  const autoJoinedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        unsubscribe = subscribeRoom<unknown>(
          code,
          (doc) => {
            setRoom(doc);
            setPhase(doc ? "ready" : "not-found");
          },
          () => setPhase("error"),
        );
      })
      .catch(() => setPhase("error"));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [code]);

  const alreadySeated = Boolean(uid && room?.players[uid]);
  const expired = Boolean(room && isRoomExpired(room));
  const roomIsJoinable =
    Boolean(room) &&
    room?.status === "waiting" &&
    Object.keys(room.players).length === 1 &&
    !expired;
  const needsToJoin = Boolean(uid && room && !alreadySeated && roomIsJoinable);

  async function handleJoin(joinName: string) {
    if (!uid || !room || joining) return;
    const roomGame = getRoomGame(room.gameId);
    if (!roomGame) return;
    setJoining(true);
    try {
      await joinRoom(code, uid, joinName, roomGame.seedGame);
      if (joinName !== name) setName(joinName);
    } catch {
      setPhase("error");
    } finally {
      setJoining(false);
    }
  }

  useEffect(() => {
    if (needsToJoin && name.trim() && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      void handleJoin(name.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsToJoin, name]);

  if (phase === "connecting" || !room || !uid) {
    return (
      <section className="card screen">
        <p>{t.rooms.connecting}</p>
      </section>
    );
  }

  if (phase === "error") {
    return (
      <section className="card screen">
        <p>{t.rooms.errorGeneric}</p>
      </section>
    );
  }

  if (phase === "not-found" || (!alreadySeated && !roomIsJoinable)) {
    const message = expired ? t.rooms.roomExpired : t.rooms.roomNotFound;
    return (
      <section className="card screen">
        <p>{message}</p>
        <div className="btn-row">
          <Link href="/rooms" className="btn primary">
            {t.rooms.backToRooms}
          </Link>
        </div>
      </section>
    );
  }

  if (needsToJoin && !name.trim()) {
    return (
      <section className="card screen">
        <span className="field-label">{t.rooms.yourNameLabel}</span>
        <input
          className="text-input"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value.slice(0, 24))}
          placeholder={t.rooms.namePlaceholder}
        />
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            disabled={joining || !nameDraft.trim()}
            onClick={() => void handleJoin(nameDraft.trim())}
          >
            {t.rooms.joinButton}
          </button>
        </div>
      </section>
    );
  }

  if (needsToJoin || joining) {
    return (
      <section className="card screen">
        <p>{t.rooms.connecting}</p>
      </section>
    );
  }

  const roomGame = getRoomGame(room.gameId);
  if (!roomGame) {
    return (
      <section className="card screen">
        <p>{t.rooms.errorGeneric}</p>
      </section>
    );
  }

  const RoomComponent = roomGame.RoomComponent;
  return <RoomComponent code={code} />;
}
