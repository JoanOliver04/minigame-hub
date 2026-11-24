"use client";

/**
 * Beat Reactor — UI component. Four lanes feed generated notes toward a
 * judgement line; the reactor core pulses with the score (blueprint §6).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ReactorLanes } from "./ReactorLanes";
import { CHART_LEAD_IN } from "./generation";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { isMotionReduced } from "@/lib/motion";
import type { Bars, Bpm, ChartDensity, ReactorDifficulty } from "./types";
import { useBeatReactor } from "./useBeatReactor";

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

  const remaining = useMemo(() => {
    const resolved = new Set(game.playerHistory.map(hit => hit.eventId));
    return game.events.filter(note => !resolved.has(note.id));
  }, [game.events, game.playerHistory]);

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
          <button className="btn primary" onClick={game.retryChart}>
            {t.beatReactor.retryChart}
          </button>
          <button className="btn" onClick={game.startMatch}>{t.beatReactor.newChart}</button>
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

  const beat = (game.nowTime - CHART_LEAD_IN) * game.bpm / 60;
  const beatPulse = Math.max(0, 1 - (beat - Math.floor(beat)) * 4);
  const end = game.events.at(-1)?.hitTime ?? CHART_LEAD_IN;
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
          style={{ transform: reduced ? undefined : `scale(${1 + beatPulse * 0.17 + Math.min(0.12, game.playerCombo / 240)})` }}
        >{game.phase === "paused" ? "Ⅱ" : beat < 0 ? Math.ceil(-beat) : ""}</div>
      </div>

      <ReactorLanes events={remaining} time={game.nowTime + game.calibrationMs / 1000}
        disabled={game.phase === "paused" || game.songDone} flash={game.flash} hitLane={game.hitLane} />

      <div className="reactor-combo-row">
        <span className="you">{t.beatReactor.comboYou(game.playerCombo)}</span>
        {game.flash && game.flash.errorMs !== null && <span className="reactor-timing">{game.flash.errorMs === 0 ? "0 ms" :
          `${game.flash.errorMs < 0 ? t.basketShot.early : t.basketShot.late} · ${Math.abs(game.flash.errorMs)} ms`}</span>}
        <span className="them">{t.beatReactor.comboAi(game.aiCombo)}</span>
      </div>
      <progress className="reactor-progress" aria-label={t.beatReactor.songProgress} max={end} value={Math.min(game.nowTime, end)} />
      <div className="btn-row">
        {!game.songDone && <button className="btn" onClick={game.phase === "paused" ? game.resume : game.pause}>
          {game.phase === "paused" ? t.play.resumeGame : t.play.pauseGame}
        </button>}
      </div>
    </section>
  );
}
