"use client";

/**
 * Dispatches a room code to the right game's RoomComponent (see
 * src/games/roomRegistry.ts), and handles the "I have a link but haven't
 * joined yet" path: auto-joins using the locally remembered player name,
 * or asks for one if this is the first time on this device.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { isRoomExpired } from "@/lib/rooms/expiry";
import { joinRoom, subscribeRoom, switchRoomGame } from "@/lib/rooms/roomsApi";
import type { RoomDoc } from "@/lib/rooms/types";
import { MAX_PLAYER_NAME_LENGTH, usePlayerName } from "@/lib/rooms/usePlayerName";
import { GAMES } from "@/games/registry";
import { getRoomGame } from "@/games/roomRegistry";
import type { RoomGameSettings } from "@/games/roomTypes";

type ClientPhase = "connecting" | "not-found" | "error" | "ready";
const multiplayerGames = GAMES.filter((game) => game.supportsMultiplayer);

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
      .catch(() => {
        if (!cancelled) setPhase("error");
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [code]);

  const alreadySeated = Boolean(uid && room && Object.hasOwn(room.players, uid));
  const isHost = Boolean(uid && room?.hostUid === uid);
  const expired = Boolean(room && isRoomExpired(room));
  const roomIsJoinable =
    Boolean(room) &&
    room?.status === "waiting" &&
    Object.keys(room.players).length === 1 &&
    !expired;
  const needsToJoin = Boolean(uid && room && !alreadySeated && roomIsJoinable);

  const joinInFlight = useRef(false);
  const handleJoin = useCallback(async (joinName: string) => {
    if (!uid || joinInFlight.current) return;
    joinInFlight.current = true;
    setJoining(true);
    try {
      await joinRoom(code, uid, joinName, async (gameId) => (await getRoomGame(gameId)?.loadLogic())?.seedGame);
      if (joinName !== name) setName(joinName);
    } catch {
      setPhase("error");
    } finally {
      joinInFlight.current = false;
      setJoining(false);
    }
  }, [code, name, setName, uid]);

  useEffect(() => {
    if (needsToJoin && name.trim() && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      void handleJoin(name.trim());
    }
  }, [handleJoin, needsToJoin, name]);

  if (phase === "error") {
    return (
      <section className="card screen">
        <p role="alert">{t.rooms.errorGeneric}</p>
        <div className="btn-row">
          <Link href="/rooms" className="btn">{t.rooms.backToRooms}</Link>
        </div>
      </section>
    );
  }

  if (phase === "connecting" || !uid) {
    return (
      <section className="card screen">
        <p role="status">{t.rooms.connecting}</p>
      </section>
    );
  }

  if (phase === "not-found" || !room || expired || (!alreadySeated && !roomIsJoinable)) {
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
        <form onSubmit={(event) => {
          event.preventDefault();
          if (nameDraft.trim()) void handleJoin(nameDraft.trim());
        }}>
          <label htmlFor="invite-player-name" className="field-label">{t.rooms.yourNameLabel}</label>
          <input id="invite-player-name" className="text-input" value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)} maxLength={MAX_PLAYER_NAME_LENGTH}
            placeholder={t.rooms.namePlaceholder} />
          <div className="btn-row room-form-actions">
            <button type="submit" className="btn primary" disabled={joining || !nameDraft.trim()}>
              {t.rooms.joinButton}
            </button>
          </div>
        </form>
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
        <p role="alert">{t.rooms.errorGeneric}</p>
        <Link href="/rooms" className="btn">{t.rooms.backToRooms}</Link>
      </section>
    );
  }

  const revision = room.gameRevision ?? 0;
  const currentGameName = t.gamesMeta[room.gameId]?.name ?? room.gameId;
  const RoomComponent = roomGame.RoomComponent;
  const selectionKey = `${room.gameId}:${revision}:${JSON.stringify(room.gameSettings ?? {})}`;

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
            <strong aria-live="polite">{currentGameName}</strong>
          </div>
        </div>
        {isHost ? (
          <RoomSettings key={selectionKey} room={room} uid={uid} />
        ) : <p>{t.rooms.guestSettingsHint}</p>}
      </section>
      <RoomComponent key={selectionKey} code={code} />
    </>
  );
}

function RoomSettings({ room, uid }: { room: RoomDoc; uid: string }) {
  const { t } = useLocale();
  const [selectedGameId, setSelectedGameId] = useState(room.gameId);
  const [draftSettings, setDraftSettings] = useState<RoomGameSettings>(room.gameSettings ?? {});
  const [switching, setSwitching] = useState(false);
  const [failed, setFailed] = useState(false);
  const selectedRoomGame = getRoomGame(selectedGameId);
  const selectedSettings = selectedRoomGame?.settings ?? [];

  function translatedSettingLabel(key: string, fallback: string) {
    return t.rooms.settingLabels[key] ?? fallback;
  }

  function translatedOptionLabel(key: string, value: string, fallback: string) {
    return t.rooms.settingOptionLabels[key]?.[value] ?? fallback;
  }

  function changeDraftGame(nextGameId: string) {
    const nextRoomGame = getRoomGame(nextGameId);
    setSelectedGameId(nextGameId);
    setDraftSettings(nextRoomGame?.defaultSettings ?? {});
  }

  async function applyRoomSelection() {
    if (!selectedRoomGame || switching) return;
    setSwitching(true);
    setFailed(false);
    try {
      const { createInitialGame, seedGame } = await selectedRoomGame.loadLogic();
      await switchRoomGame(
        room.code,
        uid,
        selectedGameId,
        draftSettings,
        createInitialGame,
        seedGame,
      );
    } catch {
      setFailed(true);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <details className="room-settings">
      <summary>{t.rooms.roomSettingsTitle}</summary>
      <p>{t.rooms.hostSettingsHint}</p>
      <label className="field-label" htmlFor="active-room-game">{t.rooms.chooseGameLabel}</label>
      <select id="active-room-game" className="text-input" value={selectedGameId}
        disabled={switching} onChange={(event) => changeDraftGame(event.target.value)}>
        {multiplayerGames.map((game) => (
          <option key={game.id} value={game.id}>{game.icon} {t.gamesMeta[game.id].name}</option>
        ))}
      </select>
      {selectedSettings.map((setting) => (
        <div key={setting.key}>
          <label className="field-label" htmlFor={`room-setting-${setting.key}`}>
            {translatedSettingLabel(setting.key, setting.label)}
          </label>
          <select id={`room-setting-${setting.key}`} className="text-input" disabled={switching}
            value={draftSettings[setting.key] ?? selectedRoomGame?.defaultSettings?.[setting.key] ?? setting.options[0]?.value ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setDraftSettings((current) => ({ ...current, [setting.key]: value }));
            }}>
            {setting.options.map((option) => (
              <option key={option.value} value={option.value}>
                {translatedOptionLabel(setting.key, option.value, option.label)}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="btn-row room-form-actions">
        <button type="button" className="btn primary" disabled={switching} onClick={applyRoomSelection}>
          {switching ? t.rooms.changingGame : t.rooms.applyRoomSettings}
        </button>
      </div>
      {failed && <p role="alert">{t.rooms.errorGeneric}</p>}
    </details>
  );
}
