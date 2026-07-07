"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { canPlayAnyMeld, validateTileRummyMeld } from "./logic";
import { TileRummyTileFace } from "./TileRummyTileFace";
import type { TileRummyDifficulty, TileRummyTile } from "./types";
import { useTileRummy } from "./useTileRummy";

const PLAYER = "player";
const AI = "ai";

export function TileRummyGame() {
  const { t } = useLocale();
  const { phase, game, selected, start, toggle, playSelected, draw, playAgain, toSetup } =
    useTileRummy();
  const [difficulty, setDifficulty] = useState<TileRummyDifficulty>("medium");

  const selectedTiles = useMemo(() => {
    if (!game) return [] as TileRummyTile[];
    return game.hands[PLAYER].filter((tile) => selected.includes(tile.id));
  }, [game, selected]);
  const validation = game ? validateTileRummyMeld(game, PLAYER, selectedTiles) : null;

  if (phase === "setup") {
    return (
      <section className="card screen tile-rummy-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["tile-rummy"].name}>{t.tileRummy.rules}</HowToPlay>
        <div className="tile-rummy-hero" aria-hidden="true">
          <span className="ruby">7</span><span className="sun">8</span>
          <span className="leaf">9</span><span className="joker">★</span>
        </div>
        <h1>{t.gamesMeta["tile-rummy"].name}</h1>
        <p className="tile-rummy-tagline">{t.tileRummy.tagline}</p>
        <span className="field-label">{t.common.aiDifficulty}</span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as TileRummyDifficulty)}
        />
        <p className="tile-rummy-note">{t.tileRummy.difficultyDescription[difficulty]}</p>
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={() => start({ difficulty })}>
            {t.common.startMatch}
          </button>
          <Link href="/rooms" className="btn">{t.tileRummy.playFriend}</Link>
        </div>
      </section>
    );
  }
  if (!game) return null;

  if (phase === "end") {
    const won = game.winner === PLAYER;
    return (
      <section className="card end-card screen tile-rummy-screen">
        <div className="end-emoji">{won ? "🏆" : "🧩"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.tileRummy.emptyRack}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const myTurn = game.turn === PLAYER;
  const canPlay = myTurn && Boolean(validation?.valid);
  const canDraw = myTurn && !canPlayAnyMeld(game, PLAYER);
  const actor = game.lastAction?.actor === PLAYER ? t.common.you : t.common.ai;
  let feedback = myTurn ? t.tileRummy.yourTurn : t.tileRummy.aiTurn;
  if (game.lastAction?.kind === "draw") feedback = t.tileRummy.drew(actor);
  if (game.lastAction?.kind === "meld") {
    feedback = t.tileRummy.played(actor, game.lastAction.count ?? 0, game.lastAction.score ?? 0);
  }
  if (game.lastAction?.kind === "win") feedback = t.tileRummy.won(actor);
  if (myTurn && selected.length > 0 && validation && !validation.valid) {
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
          <span>{t.tileRummy.tilesLeft(game.hands[PLAYER].length)}</span>
          <small>{game.opened[PLAYER] ? t.tileRummy.opened : t.tileRummy.needsOpening}</small>
        </div>
        <div>
          <strong>{t.common.ai}</strong>
          <span>{t.tileRummy.tilesLeft(game.hands[AI].length)}</span>
          <small>{game.opened[AI] ? t.tileRummy.opened : t.tileRummy.needsOpening}</small>
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
              <b>{meld.owner === PLAYER ? t.common.you : t.common.ai} · {t.tileRummy.meldKinds[meld.kind]}</b>
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
          {validation?.valid ? t.tileRummy.playMeld(validation.score) : t.tileRummy.playSelection}
        </button>
        <button className="btn" disabled={!canDraw} onClick={draw}>{t.tileRummy.drawTile}</button>
        <span>{t.tileRummy.selectedCount(selected.length)}</span>
      </div>

      <div className="tile-rummy-rack" aria-label={t.tileRummy.yourRack}>
        {game.hands[PLAYER].map((tile) => (
          <TileRummyTileFace
            key={tile.id}
            tile={tile}
            label={tileLabel(tile)}
            selected={selected.includes(tile.id)}
            disabled={!myTurn}
            onClick={() => toggle(tile.id)}
          />
        ))}
      </div>
      <p className="tile-rummy-hint">{canDraw ? t.tileRummy.drawHint : t.tileRummy.playHint}</p>
    </section>
  );
}
