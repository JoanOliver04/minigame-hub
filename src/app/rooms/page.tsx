"use client";

/**
 * Rooms landing: create a room (pick a multiplayer-capable game) or join an
 * existing one by code. Client-rendered — room data is dynamic and only
 * known at runtime, unlike /games/[gameId]'s static solo-game routes.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { ensureSignedIn } from "@/lib/firebase/anonAuth";
import { createRoom } from "@/lib/rooms/roomsApi";
import { usePlayerName } from "@/lib/rooms/usePlayerName";
import { GAMES } from "@/games/registry";
import { getRoomGame } from "@/games/roomRegistry";

const NAME_MAX = 24;
const CODE_LENGTH = 6;

export default function RoomsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = usePlayerName();
  const [tab, setTab] = useState<"create" | "join">("create");
  const multiplayerGames = GAMES.filter((game) => game.supportsMultiplayer);
  const [gameId, setGameId] = useState(multiplayerGames[0]?.id ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.rooms.nameRequired);
      return;
    }
    const roomGame = getRoomGame(gameId);
    if (!roomGame) return;

    setBusy(true);
    setError(null);
    try {
      const user = await ensureSignedIn();
      const code = await createRoom(gameId, user.uid, trimmed, roomGame.createInitialGame);
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
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setError(t.rooms.codeRequired);
      return;
    }
    setError(null);
    router.push(`/rooms/${code}`);
  }

  return (
    <section className="card screen">
      <BackLink />

      <h1>{t.rooms.title}</h1>
      <p>{t.rooms.tagline}</p>

      <span className="field-label">{t.rooms.yourNameLabel}</span>
      <input
        className="text-input"
        value={name}
        onChange={(event) => setName(event.target.value.slice(0, NAME_MAX))}
        placeholder={t.rooms.namePlaceholder}
        maxLength={NAME_MAX}
      />

      <SegPicker
        options={[
          { value: "create", label: t.rooms.createTab },
          { value: "join", label: t.rooms.joinTab },
        ]}
        value={tab}
        onChange={(value) => setTab(value as "create" | "join")}
      />

      {tab === "create" ? (
        <>
          <span className="field-label">{t.rooms.chooseGameLabel}</span>
          <SegPicker
            options={multiplayerGames.map((game) => ({
              value: game.id,
              label: `${game.icon} ${t.gamesMeta[game.id]?.name ?? game.id}`,
            }))}
            value={gameId}
            onChange={setGameId}
          />
          <div className="btn-row" style={{ marginTop: 22 }}>
            <button className="btn primary" disabled={busy} onClick={handleCreate}>
              {t.rooms.createButton}
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="field-label">{t.rooms.roomCodeLabel}</span>
          <input
            className="text-input"
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase().slice(0, CODE_LENGTH))}
            placeholder={t.rooms.codePlaceholder}
            maxLength={CODE_LENGTH}
          />
          <div className="btn-row" style={{ marginTop: 22 }}>
            <button className="btn primary" onClick={handleJoin}>
              {t.rooms.joinButton}
            </button>
          </div>
        </>
      )}

      {error && <div className="feedback lose">{error}</div>}
    </section>
  );
}
