"use client";

/**
 * Shadow Protocol — UI component. Turn-based stealth on an 11×11 facility:
 * animated vision cones, sound rings, and an alarm countdown show exactly
 * what the security system knows (blueprint §4).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { ALARM_TURNS } from "./logic";
import type { Position, ShadowDifficulty, ShadowState } from "./types";
import { samePos } from "./types";
import {
  CAMERA_VISION_RANGE,
  DIR_CYCLE,
  GUARD_VISION_RANGE,
  visibleTiles,
} from "./visibility";
import { useShadowProtocol } from "./useShadowProtocol";

const DIR_ARROWS: Record<string, string> = { n: "↑", e: "→", s: "↓", w: "←" };

function visionUnion(state: ShadowState): Set<number> {
  const seen = new Set<number>();
  for (const guard of state.guards) {
    for (const pos of visibleTiles(
      state.tiles,
      state.width,
      state.height,
      guard.pos,
      guard.facing,
      GUARD_VISION_RANGE,
    )) {
      seen.add(pos.y * state.width + pos.x);
    }
  }
  for (const camera of state.cameras) {
    if (camera.disabledFor > 0) continue;
    for (const pos of visibleTiles(
      state.tiles,
      state.width,
      state.height,
      camera.pos,
      DIR_CYCLE[camera.dirIndex],
      CAMERA_VISION_RANGE,
    )) {
      seen.add(pos.y * state.width + pos.x);
    }
  }
  return seen;
}

export function ShadowProtocolGame() {
  const {
    phase,
    state,
    armed,
    setArmed,
    lastEvents,
    score,
    startMatch,
    act,
    tapTile,
    playAgain,
    toSetup,
    hackAvailable,
    beaconSpots,
  } = useShadowProtocol();
  const { t } = useLocale();
  const [difficulty, setDifficulty] = useState<ShadowDifficulty>("medium");

  const visible = useMemo(() => (state ? visionUnion(state) : new Set<number>()), [state]);
  const noiseSet = useMemo(() => {
    if (!state?.lastNoise) return new Set<number>();
    const out = new Set<number>();
    const { source, radius } = state.lastNoise;
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (Math.abs(x - source.x) + Math.abs(y - source.y) <= radius) out.add(y * state.width + x);
      }
    }
    return out;
  }, [state]);
  const beaconSet = useMemo(
    () => new Set(beaconSpots.map((pos: Position) => pos.y * (state?.width ?? 11) + pos.x)),
    [beaconSpots, state],
  );

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <section className="card screen shadow-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["shadow-protocol"].name}>{t.shadowProtocol.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.shadowProtocol.difficultyTipLabel}>
            {t.shadowProtocol.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(v) => setDifficulty(v as ShadowDifficulty)}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            onClick={() => startMatch(difficulty)}
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  if (!state) return null;

  /* ================= END ================= */
  if (phase === "end") {
    const won = state.status === "won";
    return (
      <section className="card end-card screen shadow-screen">
        <div className="end-emoji">{won ? "🕶️" : "🚨"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.shadowProtocol.endWin : t.shadowProtocol.endLoss}
        </div>
        {won && score && (
          <div className="end-stats">
            <div className="stat-box player">
              <div className="label">{t.shadowProtocol.scoreTotal}</div>
              <div className="value">{score.total}</div>
            </div>
            <div className="stat-box neutral">
              <div className="label">{t.shadowProtocol.scoreStealth}</div>
              <div className="value">+{score.stealthBonus}</div>
            </div>
            <div className="stat-box neutral">
              <div className="label">{t.shadowProtocol.scoreAlarm}</div>
              <div className="value">+{score.alarmBonus}</div>
            </div>
            <div className="stat-box neutral">
              <div className="label">{t.shadowProtocol.scoreTurns}</div>
              <div className="value">
                {score.turnDelta >= 0 ? `+${score.turnDelta}` : score.turnDelta}
              </div>
            </div>
          </div>
        )}
        {!won && <div className="end-number">{t.shadowProtocol.lossHint}</div>}
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

  /* ================= PLAYING ================= */
  const spotted = state.spotted;
  let statusMsg = t.shadowProtocol.statusSneak;
  let statusCls = "";
  if (lastEvents.includes("escaped")) {
    statusMsg = t.shadowProtocol.endWin;
    statusCls = " win pop";
  } else if (lastEvents.includes("caught") || lastEvents.includes("alarm-zero")) {
    statusMsg = t.shadowProtocol.endLoss;
    statusCls = " lose pop";
  } else if (spotted) {
    statusMsg = t.shadowProtocol.statusSpotted(state.alarmRemaining);
    statusCls = " lose pop";
  } else if (lastEvents.includes("core-collected")) {
    statusMsg = t.shadowProtocol.statusCore;
    statusCls = " win pop";
  } else if (lastEvents.includes("guard-heard")) {
    statusMsg = t.shadowProtocol.statusHeard;
    statusCls = " tie";
  } else if (armed === "beacon") {
    statusMsg = t.shadowProtocol.statusAimBeacon;
  } else if (armed === "sprint") {
    statusMsg = t.shadowProtocol.statusSprintArmed;
  }

  return (
    <section className="card screen shadow-screen">
      <BackLink />

      <div className="shadow-hud">
        <span className="shadow-hud-item">{t.shadowProtocol.turnLabel(state.turn)}</span>
        <span className={`shadow-hud-item${state.hasCore ? " has-core" : ""}`}>
          {state.hasCore ? t.shadowProtocol.coreCollected : t.shadowProtocol.coreMissing}
        </span>
        <span
          className={`shadow-hud-item alarm${state.detectedEver ? " active" : ""}`}
          aria-live="polite"
        >
          {t.shadowProtocol.alarmLabel(state.alarmRemaining, ALARM_TURNS)}
        </span>
      </div>

      <div className={`feedback${statusCls}`} aria-live="polite">
        {statusMsg}
      </div>

      <div className="shadow-board" role="grid" aria-label={t.shadowProtocol.boardLabel}>
        {state.tiles.map((tile, i) => {
          const x = i % state.width;
          const y = Math.floor(i / state.width);
          const pos = { x, y };
          const isPlayer = samePos(state.player, pos);
          const guard = state.guards.find((g) => samePos(g.pos, pos));
          const camera = state.cameras.find((c) => samePos(c.pos, pos));
          const classes = ["shadow-tile", `t-${tile}`];
          if (visible.has(i)) classes.push("seen");
          if (noiseSet.has(i)) classes.push("noise");
          if (armed === "beacon" && beaconSet.has(i)) classes.push("beacon-target");
          if (isPlayer) classes.push("player-here");
          return (
            <button
              key={i}
              className={classes.join(" ")}
              onClick={() => tapTile(pos)}
              aria-label={t.shadowProtocol.cellLabel(
                x,
                y,
                tile,
                isPlayer,
                Boolean(guard),
                Boolean(camera),
                visible.has(i),
              )}
            >
              {isPlayer && <span className="actor you">🥷</span>}
              {guard && (
                <span className={`actor guard mode-${guard.mode}`}>
                  💂
                  <i className="facing">{DIR_ARROWS[guard.facing]}</i>
                </span>
              )}
              {camera && (
                <span className={`actor camera${camera.disabledFor > 0 ? " off" : ""}`}>
                  📷
                  {camera.disabledFor === 0 && (
                    <i className="facing">{DIR_ARROWS[DIR_CYCLE[camera.dirIndex]]}</i>
                  )}
                </span>
              )}
              {!isPlayer && !guard && tile === "core" && <span className="actor">💾</span>}
              {!isPlayer && !guard && tile === "exit" && <span className="actor">🚪</span>}
              {!isPlayer && !guard && tile === "terminal" && <span className="actor dim">🖥️</span>}
            </button>
          );
        })}
      </div>

      <div className="shadow-actions">
        <button className="btn" onClick={() => act({ kind: "wait" })}>
          {t.shadowProtocol.actionWait}
        </button>
        <button className="btn" disabled={!hackAvailable} onClick={() => act({ kind: "hack" })}>
          {t.shadowProtocol.actionHack}
        </button>
        <button
          className={`btn${armed === "sprint" ? " primary" : ""}`}
          aria-pressed={armed === "sprint"}
          onClick={() => setArmed(armed === "sprint" ? "none" : "sprint")}
        >
          {t.shadowProtocol.actionSprint}
        </button>
        <button
          className={`btn${armed === "beacon" ? " primary" : ""}`}
          aria-pressed={armed === "beacon"}
          disabled={state.beaconUsed && armed !== "beacon"}
          onClick={() => setArmed(armed === "beacon" ? "none" : "beacon")}
        >
          {t.shadowProtocol.actionBeacon}
        </button>
      </div>

      <div className="shadow-dpad" aria-label={t.shadowProtocol.dpadLabel}>
        <button className="btn" onClick={() => tapTile({ x: state.player.x, y: state.player.y - 1 })}>
          ↑
        </button>
        <div>
          <button
            className="btn"
            onClick={() => tapTile({ x: state.player.x - 1, y: state.player.y })}
          >
            ←
          </button>
          <button
            className="btn"
            onClick={() => tapTile({ x: state.player.x, y: state.player.y + 1 })}
          >
            ↓
          </button>
          <button
            className="btn"
            onClick={() => tapTile({ x: state.player.x + 1, y: state.player.y })}
          >
            →
          </button>
        </div>
      </div>

      <p className="shadow-legend">{t.shadowProtocol.legend}</p>
    </section>
  );
}
