"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { arrowTarget, canMoveTile, shortestSmallPuzzle, suggestSlidingTile } from "./logic";
import { dailyBoard } from "./daily";
import type { PuzzleSize, SlidingPuzzleState } from "./types";
import { useSlidingPuzzle } from "./useSlidingPuzzle";
import { useDailyStatus } from "./useDailyChallenge";

type PuzzleBoardStyle = CSSProperties & { "--puzzle-size": number };

export function SlidingPuzzleGame({ dailyDay }: { dailyDay?: string } = {}) {
  const { t, locale } = useLocale();
  const { phase, game, seconds, start, move, canUndo, undo, playAgain, toSetup } = useSlidingPuzzle(dailyDay);
  const { best } = useDailyStatus(dailyDay ?? null);
  const board = useRef<HTMLDivElement>(null);
  const focusResult = useCallback((heading: HTMLHeadingElement | null) => heading?.focus(), []);
  const minimum = useMemo(() => dailyDay ? shortestSmallPuzzle(dailyBoard(dailyDay))?.moves : undefined, [dailyDay]);
  const [size, setSize] = useState<PuzzleSize>(4);
  const [hint, setHint] = useState<{ game: SlidingPuzzleState; index: number } | null>(null);

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
        <div className="end-emoji" aria-hidden="true">🧩</div>
        {dailyDay && <h1>{t.daily.title}</h1>}
        <h2 ref={focusResult} tabIndex={-1} className="end-title player-win">{t.slidingPuzzle.solvedTitle}</h2>
        <div className="end-number">{t.slidingPuzzle.result(game.moves, seconds)}</div>
        {minimum !== undefined && <p className="puzzle-par">{t.daily.comparison(game.moves, minimum)}</p>}
        {dailyDay && best && <p role="status">{t.daily.best} · {t.slidingPuzzle.result(best.moves, best.seconds)}</p>}
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          {dailyDay ? <Link href="/games/sliding-puzzle" className="btn">{t.daily.freePlay}</Link>
            : <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>}
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const hintIndex = hint?.game === game ? hint.index : null;
  return (
    <section className="card screen sliding-screen">
      <BackLink />
      {dailyDay && <>
        <HowToPlay title={t.daily.title}>{t.slidingPuzzle.rules}<p>{t.daily.timing}</p></HowToPlay>
        <header className="daily-heading">
          <time dateTime={dailyDay}>{new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(dailyDay + "T12:00:00"))}</time>
          <h1>{t.daily.title}</h1>
          <p>{minimum !== undefined && t.daily.target(minimum)}</p>
          {best && <p>{t.daily.best} · {t.slidingPuzzle.result(best.moves, best.seconds)}</p>}
        </header>
      </>}
      <div className="sliding-hud">
        <div><strong>{t.slidingPuzzle.moves}</strong><span>{game.moves}</span></div>
        <div><strong>{t.slidingPuzzle.time}</strong><span>{formatTime(seconds)}</span></div>
        <div><strong>{t.slidingPuzzle.size}</strong><span>{game.size} × {game.size}</span></div>
      </div>
      <div className="feedback sliding-feedback">{dailyDay
        ? (game.moves === 0 ? t.daily.firstMove : t.daily.savedRun)
        : t.slidingPuzzle.playingHint}</div>
      <div
        ref={board}
        className="sliding-board"
        tabIndex={0}
        role="group"
        aria-describedby="puzzle-controls"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          event.preventDefault();
          const index = arrowTarget(game, event.key);
          if (index !== null) {
            board.current?.focus({ preventScroll: true });
            move(index);
          }
        }}
        style={{ "--puzzle-size": game.size } as PuzzleBoardStyle}
        aria-label={t.slidingPuzzle.boardLabel}
      >
        {game.tiles.map((tile, index) => {
          const empty = tile === 0;
          const movable = !empty && canMoveTile(game, index);
          return (
            <button
              key={tile}
              className={`sliding-tile${empty ? " empty" : ""}${movable ? " movable" : ""}`}
              style={index === hintIndex ? { outline: "2px solid var(--accent)", outlineOffset: -3 } : undefined}
              disabled={empty || !movable}
              onClick={() => move(index)}
              aria-label={empty ? t.slidingPuzzle.emptyTile : t.slidingPuzzle.tileLabel(tile)}
            >
              {tile || ""}
            </button>
          );
        })}
      </div>
      <p id="puzzle-controls" className="sliding-hint">{t.slidingPuzzle.moveHint}</p>
      <div className="btn-row">
        {!dailyDay && <button type="button" className="btn" disabled={!canUndo} onClick={undo}>{t.play.undo}</button>}
        <button type="button" className="btn" onClick={() => {
          const index = suggestSlidingTile(game);
          if (index !== null) setHint({ game, index });
        }}>{t.slidingPuzzle.hintButton}</button>
      </div>
      <p role="status">{hintIndex === null ? "" : t.slidingPuzzle.suggestedTile(game.tiles[hintIndex])}</p>
    </section>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
