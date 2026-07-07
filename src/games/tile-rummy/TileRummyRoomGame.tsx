"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { canPlayAnyMeld, validateTileRummyMeld } from "./logic";
import { TileRummyTileFace } from "./TileRummyTileFace";
import type { TileRummyTile } from "./types";
import { useTileRummyRoom } from "./useTileRummyRoom";

export function TileRummyRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, selected, isMyTurn, toggle, playSelected, draw, playAgain, leave } =
    useTileRummyRoom(code);

  if (stage === "connecting") return <section className="card screen"><p>{t.rooms.connecting}</p></section>;
  if (stage === "gone" || stage === "expired" || !room || !uid) {
    const message =
      stage === "expired" ? t.rooms.roomExpired : stage === "gone" ? t.rooms.roomGone : t.rooms.roomNotFound;
    return (
      <section className="card screen">
        <p>{message}</p>
        <Link href="/rooms" className="btn primary">{t.rooms.backToRooms}</Link>
      </section>
    );
  }
  if (stage === "error") return <section className="card screen"><p>{t.rooms.errorGeneric}</p></section>;

  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;
  if (stage === "waiting" || !opponentUid) {
    return (
      <section className="card screen tile-rummy-screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const game = room.game;
  if (stage === "finished") {
    const won = game.winner === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen tile-rummy-screen">
        <div className="end-emoji">{won ? "🏆" : "🧩"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.tileRummy.emptyRack}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>
            {voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const selectedTiles = game.hands[uid].filter((tile) => selected.includes(tile.id));
  const validation = validateTileRummyMeld(game, uid, selectedTiles);
  const canPlay = isMyTurn && validation.valid;
  const canDraw = isMyTurn && !canPlayAnyMeld(game, uid);
  const actor = game.lastAction?.actor === uid ? t.common.you : opponentName ?? "?";
  let feedback = isMyTurn ? t.tileRummy.yourTurn : t.rooms.turnOpponent(opponentName ?? "?");
  if (game.lastAction?.kind === "draw") feedback = t.tileRummy.drew(actor);
  if (game.lastAction?.kind === "meld") {
    feedback = t.tileRummy.played(actor, game.lastAction.count ?? 0, game.lastAction.score ?? 0);
  }
  if (game.lastAction?.kind === "win") feedback = t.tileRummy.won(actor);
  if (isMyTurn && selected.length > 0 && !validation.valid) {
    feedback = t.tileRummy.invalidReasons[validation.reason ?? "mixed"];
  }

  const tileLabel = (tile: TileRummyTile) =>
    tile.joker || tile.color === "joker"
      ? t.tileRummy.jokerTile
      : t.tileRummy.tileLabel(t.tileRummy.colors[tile.color], tile.value ?? 0);

  return (
    <section className="card screen tile-rummy-screen">
      <div className="tile-rummy-score">
        <div>
          <strong>{t.common.you}</strong>
          <span>{t.tileRummy.tilesLeft(game.hands[uid].length)}</span>
          <small>{game.opened[uid] ? t.tileRummy.opened : t.tileRummy.needsOpening}</small>
        </div>
        <div>
          <strong>{opponentName}</strong>
          <span>{t.tileRummy.tilesLeft(game.hands[opponentUid].length)}</span>
          <small>{game.opened[opponentUid] ? t.tileRummy.opened : t.tileRummy.needsOpening}</small>
        </div>
        <div>
          <strong>{t.tileRummy.pool}</strong>
          <span>{game.deck.length}</span>
          <small>{t.tileRummy.openingRule}</small>
        </div>
      </div>
      <div className="feedback tile-rummy-feedback">{feedback}</div>
      <div className="tile-rummy-table" aria-label={t.tileRummy.tableLabel}>
        {game.table.length === 0 ? (
          <p>{t.tileRummy.emptyTable}</p>
        ) : (
          game.table.slice(0, 8).map((meld) => (
            <div key={meld.id} className={`tile-rummy-meld ${meld.kind}`}>
              <b>{meld.owner === uid ? t.common.you : opponentName} · {t.tileRummy.meldKinds[meld.kind]}</b>
              <div>
                {meld.tiles.map((tile) => (
                  <TileRummyTileFace key={tile.id} tile={tile} label={tileLabel(tile)} disabled />
                ))}
              </div>
              <small>{t.tileRummy.points(meld.score)}</small>
            </div>
          ))
        )}
      </div>
      <div className="tile-rummy-actions">
        <button className="btn primary" disabled={!canPlay} onClick={playSelected}>
          {validation.valid ? t.tileRummy.playMeld(validation.score) : t.tileRummy.playSelection}
        </button>
        <button className="btn" disabled={!canDraw} onClick={draw}>{t.tileRummy.drawTile}</button>
        <span>{t.tileRummy.selectedCount(selected.length)}</span>
      </div>
      <div className="tile-rummy-rack" aria-label={t.tileRummy.yourRack}>
        {game.hands[uid].map((tile) => (
          <TileRummyTileFace
            key={tile.id}
            tile={tile}
            label={tileLabel(tile)}
            selected={selected.includes(tile.id)}
            disabled={!isMyTurn}
            onClick={() => toggle(tile.id)}
          />
        ))}
      </div>
      <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
    </section>
  );
}
