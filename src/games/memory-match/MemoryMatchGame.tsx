"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { MemoryConfig, MemoryDifficulty, MemoryGridSize } from "./types";
import { useMemoryMatch } from "./useMemoryMatch";

type MemoryBoardStyle = CSSProperties & { "--memory-columns": number };

export function MemoryMatchGame() {
  const { t } = useLocale();
  const { phase, stage, match, startMatch, flipPlayerTile, playAgain, toSetup } =
    useMemoryMatch();
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>("medium");
  const [size, setSize] = useState<MemoryGridSize>(4);

  if (phase === "setup") {
    return (
      <section className="card screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["memory-match"].name}>
          {t.memoryMatch.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.memoryMatch.difficultyTipLabel}>
            {t.memoryMatch.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as MemoryDifficulty)}
        />

        <span className="field-label">{t.memoryMatch.boardSize}</span>
        <SegPicker
          options={[
            { value: "4", label: t.memoryMatch.grid4 },
            { value: "6", label: t.memoryMatch.grid6 },
          ]}
          value={String(size)}
          onChange={(value) => setSize(Number(value) as MemoryGridSize)}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() =>
              startMatch({ difficulty, size } satisfies MemoryConfig)
            }
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (!match) return null;

  if (phase === "end") {
    const winner = match.winner;
    return (
      <section className="card end-card screen">
        <div className="end-emoji">
          {winner === "player" ? "🏆" : winner === "ai" ? "🤖" : "🤝"}
        </div>
        <div
          className={`end-title ${winner === "player" ? "player-win" : winner === "ai" ? "ai-win" : ""}`}
        >
          {t.memoryMatch.endTitle(winner ?? "tie")}
        </div>
        <div className="end-number">
          {t.common.finalScore(match.playerPairs, match.aiPairs)}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.memoryMatch.yourPairs}</div>
            <div className="value">{match.playerPairs}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.memoryMatch.aiPairs}</div>
            <div className="value">{match.aiPairs}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.memoryMatch.yourMoves}</div>
            <div className="value">{match.playerMoves}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.memoryMatch.aiMoves}</div>
            <div className="value">{match.aiMoves}</div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>
            {t.common.playAgain}
          </button>
          <button className="btn" onClick={toSetup}>
            {t.common.changeSettings}
          </button>
          <Link href="/" className="btn">
            {t.common.returnToHub}
          </Link>
        </div>
      </section>
    );
  }

  const playerCanFlip = match.turn === "player" && stage === "choosing";
  const feedback = match.feedback
    ? match.feedback.kind === "match"
      ? t.memoryMatch.matchFound(
          match.feedback.actor === "player" ? t.common.you : t.common.ai,
        )
      : t.memoryMatch.noMatch(
          match.feedback.actor === "player" ? t.common.you : t.common.ai,
        )
    : stage === "ai-thinking" || stage === "ai-flipping"
      ? t.memoryMatch.aiThinking
      : t.memoryMatch.chooseTiles;
  const feedbackClass = match.feedback
    ? match.feedback.kind === "match"
      ? match.feedback.actor === "player"
        ? " win pop"
        : " lose pop"
      : " high pop"
    : "";

  return (
    <section className="card screen memory-screen">
      <BackLink />

      <div className="memory-tally">
        <div className="memory-score player">
          <strong>{t.common.you}</strong>
          <span>{t.memoryMatch.pairs(match.playerPairs)}</span>
          <small>{t.memoryMatch.moves(match.playerMoves)}</small>
        </div>
        <div className={`turn-banner ${match.turn}`}>
          {match.turn === "player" ? t.memoryMatch.yourTurn : t.memoryMatch.aiTurn}
          {(stage === "ai-thinking" || stage === "ai-flipping") && (
            <span className="think-dots">
              <span />
              <span />
              <span />
            </span>
          )}
        </div>
        <div className="memory-score ai">
          <strong>{t.common.ai}</strong>
          <span>{t.memoryMatch.pairs(match.aiPairs)}</span>
          <small>{t.memoryMatch.moves(match.aiMoves)}</small>
        </div>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div
        className={`memory-board size-${match.config.size}`}
        style={{ "--memory-columns": match.config.size } as MemoryBoardStyle}
      >
        {match.tiles.map((tile, index) => {
          const visible = tile.isFlipped || tile.isSolved;
          return (
            <button
              key={tile.id}
              className={`memory-tile${visible ? " flipped" : ""}${tile.isSolved ? " solved" : ""}`}
              disabled={!playerCanFlip || visible}
              onClick={() => flipPlayerTile(index)}
              aria-label={
                tile.isSolved
                  ? t.memoryMatch.solvedTile
                  : visible
                    ? t.memoryMatch.visibleTile(tile.value)
                    : t.memoryMatch.hiddenTile
              }
            >
              <span className="memory-tile-inner">
                <span className="memory-tile-back" aria-hidden="true">?</span>
                <span className="memory-tile-front" aria-hidden="true">
                  {tile.value}
                  {tile.isSolved && <small>✓</small>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

