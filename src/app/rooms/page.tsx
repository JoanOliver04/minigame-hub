"use client";

/**
 * Rooms landing: create a room (pick a multiplayer-capable game) or join an
 * existing one by code. Client-rendered — room data is dynamic and only
 * known at runtime, unlike /games/[gameId]'s static solo-game routes.
 */

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { normalizeRoomCode, ROOM_CODE_LENGTH } from "@/lib/rooms/code";
import { MAX_PLAYER_NAME_LENGTH, usePlayerName } from "@/lib/rooms/usePlayerName";
import { GAMES } from "@/games/registry";

const multiplayerGames = GAMES.filter((game) => game.supportsMultiplayer);

export default function RoomsPage() {
  return <Suspense><RoomEntry /></Suspense>;
}

function RoomEntry() {
  const params = useSearchParams();
  const initialTab = params.get("mode") === "join" ? "join" : "create";
  const requested = params.get("game");
  return <RoomsForm key={initialTab + "/" + requested} initialTab={initialTab} requested={requested} />;
}

function RoomsForm({ initialTab, requested }: { initialTab: "create" | "join"; requested: string | null }) {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = usePlayerName();
  const [tab, setTab] = useState(initialTab);
  const [chosen, setGameId] = useState<string | null>(null);
  const gameId = chosen ?? multiplayerGames.find(game => game.id === requested)?.id ?? multiplayerGames[0].id;
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.rooms.nameRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const [{ ensureSignedIn }, { createRoom }, { getRoomGame }] = await Promise.all([
        import("@/lib/firebase/anonAuth"),
        import("@/lib/rooms/roomsApi"),
        import("@/games/roomRegistry"),
      ]);
      const roomGame = getRoomGame(gameId);
      if (!roomGame) throw new Error("Unknown room game");
      const [user, logic] = await Promise.all([ensureSignedIn(), roomGame.loadLogic()]);
      const code = await createRoom(
        gameId,
        user.uid,
        trimmed,
        () => logic.createInitialGame(roomGame.defaultSettings),
        roomGame.defaultSettings ?? {},
      );
      router.push(`/rooms/${code}`);
    } catch {
      setError(t.rooms.errorGeneric);
      setBusy(false);
    }
  }

  function handleJoin() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.rooms.nameRequired);
      return;
    }
    const code = normalizeRoomCode(codeInput);
    if (code === null) {
      setError(codeInput.trim() ? t.rooms.invalidCode : t.rooms.codeRequired);
      return;
    }
    setError(null);
    router.push(`/rooms/${code}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (tab === "create") void handleCreate();
    else handleJoin();
  }

  return (
    <section className="card screen">
      <BackLink />

      <h1>{t.rooms.title}</h1>
      <p>{t.rooms.tagline}</p>

      <form className="room-form" onSubmit={submit} aria-busy={busy}>
        <label className="field-label" htmlFor="room-player-name">{t.rooms.yourNameLabel}</label>
        <input
          id="room-player-name"
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t.rooms.namePlaceholder}
          maxLength={MAX_PLAYER_NAME_LENGTH}
        />
        <SegPicker
          options={[
            { value: "create", label: t.rooms.createTab },
            { value: "join", label: t.rooms.joinTab },
          ]}
          value={tab}
          onChange={(value) => {
            setTab(value === "join" ? "join" : "create");
            setError(null);
          }}
        />
        {tab === "create" ? (
          <>
            <label className="field-label" htmlFor="room-game">{t.rooms.chooseGameLabel}</label>
            <select id="room-game" className="text-input" value={gameId} onChange={(event) => setGameId(event.target.value)}>
              {multiplayerGames.map((game) => (
                <option key={game.id} value={game.id}>{game.icon} {t.gamesMeta[game.id].name}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label className="field-label" htmlFor="join-room-code">{t.rooms.roomCodeLabel}</label>
            <input
              id="join-room-code"
              className="text-input"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder={t.rooms.codePlaceholder}
              maxLength={ROOM_CODE_LENGTH}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </>
        )}
        <div className="btn-row room-form-actions">
          <button className="btn primary" type="submit" disabled={busy}>
            {tab === "create" ? t.rooms.createButton : t.rooms.joinButton}
          </button>
        </div>
        {error && <div className="feedback lose" role="alert">{error}</div>}
      </form>
    </section>
  );
}
