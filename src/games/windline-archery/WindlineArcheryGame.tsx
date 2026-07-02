"use client";

/**
 * Windline Archery — UI component (blueprint §9.4).
 * SVG target with ring colours, per-arrow impact dots, a wind gauge, and
 * slider + button controls (accessible alternative to drag gestures).
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { matchTotals, matchWinner } from "./logic";
import type { ArcheryDifficulty } from "./types";
import { TOTAL_ENDS } from "./types";
import { useWindlineArchery } from "./useWindlineArchery";

const RING_COLORS = ["#f4f1de", "#111827", "#5bc8ff", "#e5533d", "#ffd166"];

export function WindlineArcheryGame() {
  const game = useWindlineArchery();
  const { t } = useLocale();
  const [setupDifficulty, setSetupDifficulty] = useState<ArcheryDifficulty>("medium");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  /* ================= SETUP ================= */
  if (game.phase === "setup") {
    return (
      <section className="card screen archery-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["windline-archery"].name}>
          {t.windlineArchery.rules}
        </HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.windlineArchery.difficultyTipLabel}>
            {t.windlineArchery.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={setupDifficulty}
          onChange={(v) => {
            setSetupDifficulty(v as ArcheryDifficulty);
            game.setDifficulty(v as ArcheryDifficulty);
          }}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={game.startMatch}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  const totals = matchTotals(game.ends);

  /* ================= END ================= */
  if (game.phase === "end") {
    const winner = matchWinner(totals);
    return (
      <section className="card end-card screen archery-screen">
        <div className="end-emoji">{winner === "player" ? "🏹" : winner === "ai" ? "🤖" : "🤝"}</div>
        <div
          className={`end-title ${winner === "player" ? "player-win" : winner === "ai" ? "ai-win" : ""}`}
        >
          {t.windlineArchery.endTitle(winner)}
        </div>
        <div className="end-number">
          {t.common.finalScore(totals.playerScore, totals.aiScore)}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.windlineArchery.yourCenters}</div>
            <div className="value">{totals.playerCenters}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.windlineArchery.aiCenters}</div>
            <div className="value">{totals.aiCenters}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.windlineArchery.yourPrecision}</div>
            <div className="value">{totals.playerRadial.toFixed(2)}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.windlineArchery.aiPrecision}</div>
            <div className="value">{totals.aiRadial.toFixed(2)}</div>
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
  const end = game.ends[game.ends.length - 1];
  if (!end) return null;
  const wind = end.wind;

  return (
    <section className="card screen archery-screen">
      <BackLink />

      <div className="archery-hud">
        <span className="archery-hud-item">
          {t.windlineArchery.endLabel(game.currentEnd + 1, TOTAL_ENDS)}
        </span>
        <span className="archery-hud-item">
          {t.windlineArchery.tallyYou(totals.playerScore)}
        </span>
        <span className="archery-hud-item">{t.windlineArchery.tallyAi(totals.aiScore)}</span>
      </div>

      <div className="archery-wind" aria-live="polite">
        <span>{t.windlineArchery.windLabel}</span>
        <span
          className="archery-wind-arrow"
          style={{
            transform: `rotate(${(Math.atan2(-wind.vertical, wind.horizontal) * 180) / Math.PI}deg)`,
          }}
          aria-hidden="true"
        >
          ➜
        </span>
        <b>{Math.hypot(wind.horizontal, wind.vertical).toFixed(1)} m/s</b>
        <span className="archery-wind-detail">
          {t.windlineArchery.windDetail(wind.horizontal, wind.vertical)}
        </span>
      </div>

      <svg
        className="archery-target"
        viewBox="-1.3 -1.3 2.6 2.6"
        role="img"
        aria-label={t.windlineArchery.targetLabel}
      >
        {[1, 0.8, 0.6, 0.4, 0.2].map((r, i) => (
          <circle
            key={r}
            cx="0"
            cy="0"
            r={r}
            fill={RING_COLORS[i]}
            stroke="#0f1220"
            strokeWidth="0.015"
          />
        ))}
        {game.ends.map((e, i) => (
          <g key={i}>
            {e.player && (
              <circle
                cx={Math.max(-1.25, Math.min(1.25, e.player.impact.x))}
                cy={Math.max(-1.25, Math.min(1.25, -e.player.impact.y))}
                r="0.055"
                className={`archery-dot player${i === game.currentEnd ? " fresh" : ""}`}
              />
            )}
            {e.ai && (
              <circle
                cx={Math.max(-1.25, Math.min(1.25, e.ai.impact.x))}
                cy={Math.max(-1.25, Math.min(1.25, -e.ai.impact.y))}
                r="0.055"
                className={`archery-dot ai${i === game.currentEnd ? " fresh" : ""}`}
              />
            )}
          </g>
        ))}
      </svg>

      <div className="feedback" aria-live="polite">
        {game.stage === "aim" && t.windlineArchery.aimPrompt}
        {game.stage === "meter" && t.windlineArchery.releasePrompt}
        {game.stage === "resolving" &&
          end.player &&
          (end.ai
            ? t.windlineArchery.bothResult(end.player.score, end.ai.score)
            : t.windlineArchery.yourResult(end.player.score))}
      </div>

      {game.stage === "meter" ? (
        <div className="archery-meter-wrap">
          <div
            className="archery-meter"
            role="slider"
            aria-label={t.windlineArchery.meterLabel}
            aria-valuemin={-100}
            aria-valuemax={100}
            aria-valuenow={Math.round(game.meterValue * 100)}
          >
            <div className="zone" />
            <div
              className="needle"
              style={{ left: `${50 + game.meterValue * 48}%` }}
            />
          </div>
          <button className="btn primary archery-release" onClick={game.release}>
            {t.windlineArchery.releaseButton}
          </button>
        </div>
      ) : (
        <div className="archery-controls">
          <label className="archery-slider">
            {t.windlineArchery.angleLabel(game.angle)}
            <input
              type="range"
              min={2}
              max={20}
              step={0.5}
              value={game.angle}
              disabled={game.stage !== "aim"}
              onChange={(e) => game.setAngle(Number(e.target.value))}
            />
          </label>
          <label className="archery-slider">
            {t.windlineArchery.windageLabel(game.windage)}
            <input
              type="range"
              min={-4}
              max={4}
              step={0.1}
              value={game.windage}
              disabled={game.stage !== "aim"}
              onChange={(e) => game.setWindage(Number(e.target.value))}
            />
          </label>
          <label className="archery-slider">
            {t.windlineArchery.powerLabel(game.power)}
            <input
              type="range"
              min={30}
              max={100}
              step={1}
              value={game.power}
              disabled={game.stage !== "aim"}
              onChange={(e) => game.setPower(Number(e.target.value))}
            />
          </label>
          <button
            className="btn primary"
            disabled={game.stage !== "aim"}
            onClick={game.startMeter}
          >
            {t.windlineArchery.drawButton}
          </button>
        </div>
      )}

      <div className="archery-ends">
        {Array.from({ length: TOTAL_ENDS }, (_, i) => {
          const e = game.ends[i];
          return (
            <div key={i} className={`archery-end-chip${i === game.currentEnd ? " current" : ""}`}>
              <span>{i + 1}</span>
              <b className="you">{e?.player ? e.player.score : "–"}</b>
              <b className="them">{e?.ai ? e.ai.score : "–"}</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}
