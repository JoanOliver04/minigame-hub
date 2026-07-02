"use client";

/**
 * Beat Reactor — UI component. Four lanes feed generated notes toward a
 * judgement line; the reactor core pulses with the score (blueprint §6).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { isMotionReduced } from "@/lib/motion";
import type { Bars, Bpm, ChartDensity, Lane, ReactorDifficulty } from "./types";
import { LANE_KEYS } from "./types";
import { useBeatReactor } from "./useBeatReactor";

const LANE_LABELS = ["D", "F", "J", "K"];

export function BeatReactorGame() {
  const game = useBeatReactor();
  const { t } = useLocale();
  const [reduced] = useState(() => (typeof window === "undefined" ? false : isMotionReduced()));

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];
  const BPM_OPTIONS = [
    { value: "90", label: "90" },
    { value: "110", label: "110" },
    { value: "130", label: "130" },
  ];
  const BARS_OPTIONS = [
    { value: "8", label: t.beatReactor.barsShort },
    { value: "12", label: t.beatReactor.barsMedium },
    { value: "16", label: t.beatReactor.barsLong },
  ];
  const DENSITY_OPTIONS = [
    { value: "light", label: t.beatReactor.densityLight },
    { value: "normal", label: t.beatReactor.densityNormal },
    { value: "dense", label: t.beatReactor.densityDense },
  ];

  const upcoming = useMemo(() => {
    const windowSeconds = 2.2;
    return game.events.filter(
      (event) => event.hitTime - game.nowTime >= -0.15 && event.hitTime - game.nowTime <= windowSeconds,
    );
  }, [game.events, game.nowTime]);

  /* ================= SETUP ================= */
  if (game.phase === "setup") {
    return (
      <section className="card screen reactor-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["beat-reactor"].name}>{t.beatReactor.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.beatReactor.difficultyTipLabel}>{t.beatReactor.difficultyTip}</InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={game.difficulty}
          onChange={(v) => game.setDifficulty(v as ReactorDifficulty)}
        />

        <span className="field-label">{t.beatReactor.bpmLabel}</span>
        <SegPicker
          options={BPM_OPTIONS}
          value={String(game.bpm)}
          onChange={(v) => game.setBpm(Number(v) as Bpm)}
        />

        <span className="field-label">{t.beatReactor.lengthLabel}</span>
        <SegPicker
          options={BARS_OPTIONS}
          value={String(game.bars)}
          onChange={(v) => game.setBars(Number(v) as Bars)}
        />

        <span className="field-label">{t.beatReactor.densityLabel}</span>
        <SegPicker
          options={DENSITY_OPTIONS}
          value={game.density}
          onChange={(v) => game.setDensity(v as ChartDensity)}
        />

        <div className="toggle-row" style={{ marginTop: 8 }}>
          <label>
            <input type="checkbox" checked={game.muted} onChange={(e) => game.setMuted(e.target.checked)} />
            {t.beatReactor.silentMode}
          </label>
        </div>

        <label className="archery-slider" style={{ margin: "8px auto", maxWidth: 320 }}>
          {t.beatReactor.calibrationLabel(game.calibrationMs)}
          <input
            type="range"
            min={-150}
            max={150}
            step={5}
            value={game.calibrationMs}
            onChange={(e) => game.setCalibration(Number(e.target.value))}
          />
        </label>

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={game.startMatch}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  const totalNotes = game.events.length;
  const playerAccuracy =
    game.playerHistory.length > 0
      ? Math.round(
          (game.playerHistory.filter((h) => h.judgement !== "miss").length / totalNotes) * 100,
        )
      : 0;

  /* ================= END ================= */
  if (game.phase === "end") {
    const winner = game.playerScore > game.aiScore ? "player" : game.playerScore < game.aiScore ? "ai" : "tie";
    return (
      <section className="card end-card screen reactor-screen">
        <div className="end-emoji">{winner === "player" ? "⚡" : winner === "ai" ? "🤖" : "🤝"}</div>
        <div
          className={`end-title ${winner === "player" ? "player-win" : winner === "ai" ? "ai-win" : ""}`}
        >
          {t.beatReactor.endTitle(winner)}
        </div>
        <div className="end-number">{t.common.finalScore(game.playerScore, game.aiScore)}</div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.beatReactor.yourBestCombo}</div>
            <div className="value">{game.playerBestCombo}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.beatReactor.aiBestCombo}</div>
            <div className="value">{game.aiBestCombo}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.beatReactor.accuracy}</div>
            <div className="value">{playerAccuracy}%</div>
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
    <section className="card screen reactor-screen">
      <BackLink />

      <div className="reactor-hud">
        <span className="reactor-hud-item you">{t.beatReactor.tallyYou(game.playerScore)}</span>
        <span className="reactor-hud-item combo">×{game.comboMultiplier(game.playerCombo).toFixed(1)}</span>
        <span className="reactor-hud-item them">{t.beatReactor.tallyAi(game.aiScore)}</span>
      </div>

      <div
        className={`reactor-core${!reduced && game.reactorShake > 0 ? " shake" : ""}`}
        aria-hidden="true"
      >
        <div
          className="reactor-core-inner"
          style={{ transform: `scale(${1 + Math.min(0.25, game.playerCombo / 200)})` }}
        />
      </div>

      <div className="reactor-lanes" role="group" aria-label={t.beatReactor.lanesLabel}>
        {[0, 1, 2, 3].map((lane) => (
          <div key={lane} className="reactor-lane">
            <div className="reactor-lane-track">
              {upcoming
                .filter((event) => event.lane === lane)
                .map((event) => {
                  const progress = 1 - (event.hitTime - game.nowTime) / 2.2;
                  return (
                    <div
                      key={event.id}
                      className={`reactor-note${event.accent ? " accent" : ""}`}
                      style={{ top: `${Math.max(0, Math.min(100, progress * 100))}%` }}
                    />
                  );
                })}
              {game.flash && game.flash.lane === lane && (
                <div key={game.flash.key} className={`reactor-flash j-${game.flash.judgement}`}>
                  {t.beatReactor.judgementLabel[game.flash.judgement]}
                </div>
              )}
            </div>
            <button
              className="btn reactor-pad"
              onClick={() => game.hitLane(lane as Lane)}
              aria-label={t.beatReactor.laneButtonLabel(lane + 1)}
            >
              {LANE_LABELS[lane]}
              <i>{LANE_KEYS[lane].toUpperCase()}</i>
            </button>
          </div>
        ))}
      </div>

      <div className="reactor-combo-row">
        <span className="you">{t.beatReactor.comboYou(game.playerCombo)}</span>
        <span className="them">{t.beatReactor.comboAi(game.aiCombo)}</span>
      </div>
    </section>
  );
}
