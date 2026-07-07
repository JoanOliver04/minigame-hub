"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { getPlayableDominoes, getPlayableSides, tilePips } from "./logic";
import { DominoTileFace } from "./DominoTileFace";
import type { DominoDifficulty, DominoGameState, DominoTile } from "./types";
import { useDomino } from "./useDomino";

const PLAYER = "player";
const AI = "ai";

export function DominoGame() {
  const { t } = useLocale();
  const { phase, game, selected, start, toggle, play, draw, pass, playAgain, toSetup } = useDomino();
  const [difficulty, setDifficulty] = useState<DominoDifficulty>("medium");

  const selectedTile = useMemo(
    () => (game && selected ? game.hands[PLAYER].find((tile) => tile.id === selected) : undefined),
    [game, selected],
  );
  const legalSides = game && selectedTile ? getPlayableSides(game, selectedTile) : [];

  if (phase === "setup") {
    return (
      <section className="card screen domino-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.domino.name}>{t.domino.rules}</HowToPlay>
        <div className="domino-hero" aria-hidden="true">
          <span>6|6</span><span>5|3</span><span>4|0</span>
        </div>
        <h1>{t.gamesMeta.domino.name}</h1>
        <p className="domino-tagline">{t.domino.tagline}</p>
        <span className="field-label">{t.common.aiDifficulty}</span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as DominoDifficulty)}
        />
        <p className="domino-note">{t.domino.difficultyDescription[difficulty]}</p>
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={() => start({ difficulty })}>{t.common.startMatch}</button>
          <Link href="/rooms" className="btn">{t.domino.playFriend}</Link>
        </div>
      </section>
    );
  }
  if (!game) return null;

  if (phase === "end") {
    const won = game.winner === PLAYER;
    return (
      <section className="card end-card screen domino-screen">
        <div className="end-emoji">{game.tie ? "🤝" : won ? "🏆" : "🁢"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {game.tie ? t.domino.blockedTie : won ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.domino.endScore(handScore(game.hands[PLAYER]), handScore(game.hands[AI]))}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const myTurn = game.turn === PLAYER;
  const playable = getPlayableDominoes(game, PLAYER);
  const canDraw = myTurn && playable.length === 0 && game.boneyard.length > 0;
  const canPass = myTurn && playable.length === 0 && game.boneyard.length === 0;
  const actor = game.lastAction?.actor === PLAYER ? t.common.you : t.common.ai;
  let feedback = myTurn ? t.domino.yourTurn : t.domino.aiTurn;
  if (game.lastAction?.kind === "play" && game.lastAction.tile) feedback = t.domino.played(actor, tileText(game.lastAction.tile));
  if (game.lastAction?.kind === "draw") feedback = t.domino.drew(actor);
  if (game.lastAction?.kind === "pass") feedback = t.domino.passed(actor);
  if (game.lastAction?.kind === "win") feedback = t.domino.won(actor);
  if (game.lastAction?.kind === "block") feedback = t.domino.blockedTie;
  if (myTurn && selectedTile && legalSides.length === 0) feedback = t.domino.notPlayable;

  return (
    <section className="card screen domino-screen">
      <Score game={game} you={t.common.you} them={t.common.ai} pool={t.domino.pool} tilesLeft={t.domino.tilesLeft} />
      <div className="feedback domino-feedback">{feedback}</div>
      <DominoBoard game={game} empty={t.domino.emptyBoard} label={t.domino.boardLabel} tileLabel={t.domino.tileLabel} />
      <div className="domino-actions">
        <button className="btn primary" disabled={!myTurn || !selectedTile || !legalSides.includes("left")} onClick={() => play("left")}>
          {t.domino.playLeft}
        </button>
        <button className="btn primary" disabled={!myTurn || !selectedTile || !legalSides.includes("right")} onClick={() => play("right")}>
          {t.domino.playRight}
        </button>
        <button className="btn" disabled={!canDraw} onClick={draw}>{t.domino.drawTile}</button>
        <button className="btn" disabled={!canPass} onClick={pass}>{t.domino.pass}</button>
      </div>
      <div className="domino-rack" aria-label={t.domino.yourHand}>
        {game.hands[PLAYER].map((tile) => (
          <DominoTileFace
            key={tile.id}
            tile={tile}
            label={t.domino.tileLabel(tile.a, tile.b)}
            selected={selected === tile.id}
            disabled={!myTurn}
            onClick={() => toggle(tile.id)}
          />
        ))}
      </div>
      <p className="domino-hint">{canDraw ? t.domino.drawHint : t.domino.playHint}</p>
    </section>
  );
}

function handScore(hand: DominoTile[]) {
  return hand.reduce((total, tile) => total + tilePips(tile), 0);
}

function tileText(tile: DominoTile) {
  return `${tile.a}-${tile.b}`;
}

function Score({
  game,
  you,
  them,
  pool,
  tilesLeft,
}: {
  game: DominoGameState;
  you: string;
  them: string;
  pool: string;
  tilesLeft: (count: number) => string;
}) {
  return (
    <div className="domino-score">
      <div><strong>{you}</strong><span>{tilesLeft(game.hands[PLAYER].length)}</span><small>{handScore(game.hands[PLAYER])} pts</small></div>
      <div><strong>{them}</strong><span>{tilesLeft(game.hands[AI].length)}</span><small>{handScore(game.hands[AI])} pts</small></div>
      <div><strong>{pool}</strong><span>{game.boneyard.length}</span><small>{game.leftValue ?? "-"} / {game.rightValue ?? "-"}</small></div>
    </div>
  );
}

function DominoBoard({
  game,
  empty,
  label,
  tileLabel,
}: {
  game: NonNullable<ReturnType<typeof useDomino>["game"]>;
  empty: string;
  label: string;
  tileLabel: (a: number, b: number) => string;
}) {
  return (
    <div className="domino-board" aria-label={label}>
      {game.board.length === 0 ? (
        <p>{empty}</p>
      ) : (
        game.board.map((tile) => (
          <DominoTileFace key={`${tile.id}-${tile.left}-${tile.right}`} tile={tile} label={tileLabel(tile.left, tile.right)} disabled />
        ))
      )}
    </div>
  );
}
