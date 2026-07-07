"use client";

/**
 * Dispatches a room code to the right game's RoomComponent (see
 * src/games/roomRegistry.ts), and handles the "I have a link but haven't
 * joined yet" path: auto-joins using the locally remembered player name,
 * or asks for one if this is the first time on this device.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { joinRoom, subscribeRoom, switchRoomGame } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { usePlayerName } from "@/lib/rooms/usePlayerName";
import { GAMES } from "@/games/registry";
import { getRoomGame } from "@/games/roomRegistry";
import type { RoomGameSettings } from "@/games/roomTypes";

type ClientPhase = "connecting" | "not-found" | "error" | "ready";

export function RoomClient({ code }: { code: string }) {
  const { t } = useLocale();
  const [name, setName] = usePlayerName();
  const [nameDraft, setNameDraft] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [phase, setPhase] = useState<ClientPhase>("connecting");
  const [joining, setJoining] = useState(false);
  const [draftGameId, setDraftGameId] = useState("");
  const [draftSettings, setDraftSettings] = useState<RoomGameSettings>({});
  const [switching, setSwitching] = useState(false);
  const autoJoinedRef = useRef(false);
  const lastSyncedRoomRef = useRef("");

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

  useEffect(() => {
    if (!room) return;
    const syncKey = `${room.gameId}:${JSON.stringify(room.gameSettings ?? {})}`;
    if (lastSyncedRoomRef.current === syncKey) return;
    lastSyncedRoomRef.current = syncKey;
    const timer = setTimeout(() => {
      setDraftGameId(room.gameId);
      setDraftSettings(room.gameSettings ?? {});
    }, 0);
    return () => clearTimeout(timer);
  }, [room]);

  const alreadySeated = Boolean(uid && room?.players[uid]);
  const isHost = Boolean(uid && room?.hostUid === uid);
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

  const multiplayerGames = GAMES.filter((game) => game.supportsMultiplayer);
  const selectedGameId = draftGameId || room.gameId;
  const selectedRoomGame = getRoomGame(selectedGameId);
  const selectedSettings = selectedRoomGame?.settings ?? [];
  const currentGameName = t.gamesMeta[room.gameId]?.name ?? room.gameId;

  function translatedSettingLabel(key: string, fallback: string) {
    return t.rooms.settingLabels[key] ?? fallback;
  }

  function translatedOptionLabel(key: string, value: string, fallback: string) {
    return t.rooms.settingOptionLabels[key]?.[value] ?? fallback;
  }

  function changeDraftGame(nextGameId: string) {
    const nextRoomGame = getRoomGame(nextGameId);
    setDraftGameId(nextGameId);
    setDraftSettings(nextRoomGame?.defaultSettings ?? {});
  }

  async function applyRoomSelection() {
    if (!uid || !selectedRoomGame || switching || !isHost) return;
    setSwitching(true);
    try {
      await switchRoomGame(
        code,
        uid,
        selectedGameId,
        draftSettings,
        selectedRoomGame.createInitialGame,
        selectedRoomGame.seedGame,
      );
    } catch {
      setPhase("error");
    } finally {
      setSwitching(false);
    }
  }

  const RoomComponent = roomGame.RoomComponent;
  return (
    <>
      <section className="card room-control-panel">
        <div className="room-control-heading">
          <div>
            <span className="field-label">{t.rooms.roomCodeLabel}</span>
            <div className="end-number">{room.code}</div>
          </div>
          <div>
            <span className="field-label">{t.rooms.currentGameLabel}</span>
            <strong>{currentGameName}</strong>
          </div>
        </div>

        <h2>{t.rooms.roomSettingsTitle}</h2>
        <p>{isHost ? t.rooms.hostSettingsHint : t.rooms.guestSettingsHint}</p>

        {isHost && (
          <>
            <span className="field-label">{t.rooms.chooseGameLabel}</span>
            <SegPicker
              options={multiplayerGames.map((game) => ({
                value: game.id,
                label: `${game.icon} ${t.gamesMeta[game.id]?.name ?? game.id}`,
              }))}
              value={selectedGameId}
              onChange={changeDraftGame}
            />

            {selectedSettings.map((setting) => (
              <div key={setting.key}>
                <span className="field-label">
                  {translatedSettingLabel(setting.key, setting.label)}
                </span>
                <SegPicker
                  options={setting.options.map((option) => ({
                    value: option.value,
                    label: translatedOptionLabel(setting.key, option.value, option.label),
                  }))}
                  value={draftSettings[setting.key] ?? selectedRoomGame?.defaultSettings?.[setting.key] ?? setting.options[0]?.value ?? ""}
                  onChange={(value) =>
                    setDraftSettings((current) => ({ ...current, [setting.key]: value }))
                  }
                />
              </div>
            ))}

            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className="btn primary" disabled={switching} onClick={applyRoomSelection}>
                {switching ? t.rooms.changingGame : t.rooms.applyRoomSettings}
              </button>
            </div>
          </>
        )}
      </section>
      <RoomComponent key={`${room.gameId}:${JSON.stringify(room.gameSettings ?? {})}`} code={code} />
    </>
  );
}
