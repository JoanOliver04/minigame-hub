"use client";

/**
 * Circuit Breaker — UI component. Simultaneous-turn light-cycle duel on a
 * 21×15 grid; both cycles advance together every tick (blueprint §8).
 */

import { useMemo } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { BreakerDifficulty } from "./types";
import { GRID_HEIGHT, GRID_WIDTH, ROUND_TARGET } from "./types";
import { useCircuitBreaker } from "./useCircuitBreaker";

export function CircuitBreakerGame() {
  const game = useCircuitBreaker();
  const { t } = useLocale();

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  const cellClasses = useMemo(() => {
    const classes = new Array(GRID_WIDTH * GRID_HEIGHT).fill("");
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const i = y * GRID_WIDTH + x;
        if (game.round.grid[i] === 1) classes[i] = "wall";
      }
    }
    const pIdx = game.round.player.pos.y * GRID_WIDTH + game.round.player.pos.x;
    const aIdx = game.round.ai.pos.y * GRID_WIDTH + game.round.ai.pos.x;
    if (game.round.player.alive) classes[pIdx] = "head player";
    if (game.round.ai.alive) classes[aIdx] = "head ai";
    return classes;
  }, [game.round]);

  /* ================= SETUP ================= */
  if (game.phase === "setup") {
    return (
      <section className="card screen breaker-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["circuit-breaker"].name}>{t.circuitBreaker.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.circuitBreaker.difficultyTipLabel}>
            {t.circuitBreaker.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={game.difficulty}
          onChange={(v) => game.setDifficulty(v as BreakerDifficulty)}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={game.startMatch}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  /* ================= END ================= */
  if (game.phase === "end") {
    const playerWon = game.playerWins > game.aiWins;
    return (
      <section className="card end-card screen breaker-screen">
        <div className="end-emoji">{playerWon ? "🏍️" : "🤖"}</div>
        <div className={`end-title ${playerWon ? "player-win" : "ai-win"}`}>
          {playerWon ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.common.finalScore(game.playerWins, game.aiWins)}</div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.circuitBreaker.yourWins}</div>
            <div className="value">{game.playerWins}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.circuitBreaker.aiWins}</div>
            <div className="value">{game.aiWins}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.circuitBreaker.ties}</div>
            <div className="value">{game.ties}</div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={game.playAgain}>
            {t.common.playAgain}
          </button>
          <button className="btn" onClick={game.toSetup}>
            {t.common.changeSettings}
          </button>
          <Link href="/" className="btn">
            {t.common.returnToHub}
          </Link>
        </div>
      </section>
    );
  }

  /* ================= PLAYING ================= */
  return (
    <section className="card screen breaker-screen">
      <BackLink />

      <div className="rps-tally">
        <span className="you">{t.circuitBreaker.tallyYou(game.playerWins)}</span>
        <span className="goal">{t.circuitBreaker.tallyGoal(ROUND_TARGET)}</span>
        <span className="them">{t.circuitBreaker.tallyAi(game.aiWins)}</span>
      </div>

      <div className={`feedback${game.round.status === "round-over" ? " pop" : ""}`}>
        {game.round.status === "round-over"
          ? game.round.roundResult === "player"
            ? t.circuitBreaker.winRound
            : game.round.roundResult === "ai"
              ? t.circuitBreaker.loseRound
              : t.circuitBreaker.tieRound
          : t.circuitBreaker.steer}
      </div>

      <div
        className="breaker-grid"
        style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)` }}
        role="img"
        aria-label={t.circuitBreaker.arenaLabel}
      >
        {cellClasses.map((cls, i) => (
          <div key={i} className={`breaker-cell ${cls}`} />
        ))}
      </div>

      <div className="breaker-controls">
        <button className="btn breaker-pad" onClick={() => game.setPendingAction("left")}>
          ↺ {t.circuitBreaker.turnLeft}
        </button>
        <button className="btn breaker-pad" onClick={() => game.setPendingAction("straight")}>
          ↑ {t.circuitBreaker.straight}
        </button>
        <button className="btn breaker-pad" onClick={() => game.setPendingAction("right")}>
          ↻ {t.circuitBreaker.turnRight}
        </button>
      </div>
    </section>
  );
}
