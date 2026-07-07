"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { canMoveTile } from "./logic";
import type { PuzzleSize } from "./types";
import { useSlidingPuzzle } from "./useSlidingPuzzle";

type PuzzleBoardStyle = CSSProperties & { "--puzzle-size": number };

export function SlidingPuzzleGame() {
  const { t } = useLocale();
  const { phase, game, seconds, start, move, playAgain, toSetup } = useSlidingPuzzle();
  const [size, setSize] = useState<PuzzleSize>(4);

  if (phase === "setup") {
    return (
      <section className="card screen sliding-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["sliding-puzzle"].name}>{t.slidingPuzzle.rules}</HowToPlay>
        <div className="sliding-hero" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 0, 8].map((tile, index) => (
            <span key={`${tile}-${index}`} className={tile === 0 ? "empty" : ""}>{tile || ""}</span>
          ))}
        </div>
        <h1>{t.gamesMeta["sliding-puzzle"].name}</h1>
        <p className="sliding-tagline">{t.slidingPuzzle.tagline}</p>
        <span className="field-label">{t.slidingPuzzle.boardSize}</span>
        <SegPicker
          options={[
            { value: "3", label: t.slidingPuzzle.sizeLabels[3] },
            { value: "4", label: t.slidingPuzzle.sizeLabels[4] },
            { value: "5", label: t.slidingPuzzle.sizeLabels[5] },
          ]}
          value={String(size)}
          onChange={(value) => setSize(Number(value) as PuzzleSize)}
        />
        <p className="sliding-note">{t.slidingPuzzle.sizeDescription[size]}</p>
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={() => start({ size })}>{t.common.startMatch}</button>
        </div>
      </section>
    );
  }

  if (!game) return null;

  if (phase === "end") {
    return (
      <section className="card end-card screen sliding-screen">
        <div className="end-emoji">🧩</div>
        <div className="end-title player-win">{t.slidingPuzzle.solvedTitle}</div>
        <div className="end-number">{t.slidingPuzzle.result(game.moves, seconds)}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card screen sliding-screen">
      <BackLink />
      <div className="sliding-hud">
        <div><strong>{t.slidingPuzzle.moves}</strong><span>{game.moves}</span></div>
        <div><strong>{t.slidingPuzzle.time}</strong><span>{formatTime(seconds)}</span></div>
        <div><strong>{t.slidingPuzzle.size}</strong><span>{game.size} × {game.size}</span></div>
      </div>
      <div className="feedback sliding-feedback">{t.slidingPuzzle.playingHint}</div>
      <div
        className="sliding-board"
        style={{ "--puzzle-size": game.size } as PuzzleBoardStyle}
        aria-label={t.slidingPuzzle.boardLabel}
      >
        {game.tiles.map((tile, index) => {
          const empty = tile === 0;
          const movable = !empty && canMoveTile(game, index);
          return (
            <button
              key={`${tile}-${index}`}
              className={`sliding-tile${empty ? " empty" : ""}${movable ? " movable" : ""}`}
              disabled={empty || !movable}
              onClick={() => move(index)}
              aria-label={empty ? t.slidingPuzzle.emptyTile : t.slidingPuzzle.tileLabel(tile)}
            >
              {tile || ""}
            </button>
          );
        })}
      </div>
      <p className="sliding-hint">{t.slidingPuzzle.moveHint}</p>
    </section>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
