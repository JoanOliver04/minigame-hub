"use client";

/**
 * Fleet Command — UI component. Setup (manual/random placement), playing
 * (two boards with tab switching on small screens), end (blueprint §7.4).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import type { FleetDifficulty, ShotRecord, SonarReading } from "./types";
import { BOARD_SIZE, FLEET_LENGTHS, SONAR_RADIUS, toXY } from "./types";
import { useFleetCommand } from "./useFleetCommand";

type CellView = "none" | "miss" | "hit" | "sunk";

function shotMap(history: ShotRecord[]): CellView[] {
  const marks: CellView[] = new Array(BOARD_SIZE * BOARD_SIZE).fill("none");
  for (const shot of history) {
    marks[shot.index] = shot.result === "miss" ? "miss" : "hit";
    if (shot.result === "sunk" && shot.sunkCells) {
      for (const cell of shot.sunkCells) marks[cell] = "sunk";
    }
  }
  return marks;
}

function sonarRegion(sonar: SonarReading | null): Set<number> {
  const region = new Set<number>();
  if (!sonar) return region;
  const { x, y } = toXY(sonar.center);
  for (let dy = -SONAR_RADIUS; dy <= SONAR_RADIUS; dy++) {
    for (let dx = -SONAR_RADIUS; dx <= SONAR_RADIUS; dx++) {
      const cx = x + dx;
      const cy = y + dy;
      if (cx >= 0 && cy >= 0 && cx < BOARD_SIZE && cy < BOARD_SIZE) {
        region.add(cy * BOARD_SIZE + cx);
      }
    }
  }
  return region;
}

export function FleetCommandGame() {
  const game = useFleetCommand();
  const { t } = useLocale();
  const [mobileTab, setMobileTab] = useState<"enemy" | "fleet">("enemy");

  const enemyMarks = useMemo(() => shotMap(game.playerHistory), [game.playerHistory]);
  const ownMarks = useMemo(() => shotMap(game.aiHistory), [game.aiHistory]);
  const sonarCells = useMemo(() => sonarRegion(game.playerSonar), [game.playerSonar]);
  const ownShipCells = useMemo(() => {
    const set = new Set<number>();
    for (const ship of game.playerShips) for (const cell of ship.cells) set.add(cell);
    return set;
  }, [game.playerShips]);

  const enemySunkLengths = useMemo(
    () =>
      game.playerHistory
        .filter((shot) => shot.result === "sunk" && shot.sunkLength)
        .map((shot) => shot.sunkLength!),
    [game.playerHistory],
  );

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  /* ================= SETUP ================= */
  if (game.phase === "setup") {
    const placedCells = new Map<number, number>();
    for (const ship of game.placedShips) {
      for (const cell of ship.cells) placedCells.set(cell, ship.id);
    }
    return (
      <section className="card screen fleet-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["fleet-command"].name}>{t.fleetCommand.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.fleetCommand.difficultyTipLabel}>
            {t.fleetCommand.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={game.difficulty}
          onChange={(v) => game.setDifficulty(v as FleetDifficulty)}
        />

        <span className="field-label">{t.fleetCommand.placementTitle}</span>
        <p className="fleet-hint">
          {game.nextLengthToPlace !== null
            ? t.fleetCommand.placeShipHint(game.nextLengthToPlace)
            : t.fleetCommand.fleetReady}
        </p>
        <div className="fleet-board own" role="grid" aria-label={t.fleetCommand.yourBoardLabel}>
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => (
            <button
              key={i}
              className={`fleet-cell${placedCells.has(i) ? " ship" : ""}`}
              onClick={() => game.placeAt(i)}
              aria-label={t.fleetCommand.placementCellLabel(
                (i % BOARD_SIZE) + 1,
                Math.floor(i / BOARD_SIZE) + 1,
                placedCells.has(i),
              )}
            />
          ))}
        </div>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => game.setHorizontal(!game.horizontal)}>
            {game.horizontal ? t.fleetCommand.rotateToVertical : t.fleetCommand.rotateToHorizontal}
          </button>
          <button className="btn" onClick={game.shufflePlacement}>
            {t.fleetCommand.randomPlacement}
          </button>
          <button className="btn" onClick={game.clearPlacement}>
            {t.fleetCommand.clearPlacement}
          </button>
        </div>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button
            className="btn primary"
            style={{ minWidth: 180 }}
            disabled={game.placedShips.length !== FLEET_LENGTHS.length}
            onClick={game.startMatch}
          >
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  /* ================= END ================= */
  if (game.phase === "end") {
    return (
      <section className="card end-card screen fleet-screen">
        <div className="end-emoji">{game.won ? "⚓" : "🌊"}</div>
        <div className={`end-title ${game.won ? "player-win" : "ai-win"}`}>
          {game.won ? t.fleetCommand.endWin : t.fleetCommand.endLoss}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.fleetCommand.yourShots}</div>
            <div className="value">{game.playerHistory.length}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.fleetCommand.aiShots}</div>
            <div className="value">{game.aiHistory.length}</div>
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
  const feedbackMsg =
    game.stage === "ai" ? (
      <>
        {t.fleetCommand.aiThinking}
        <span className="think-dots">
          <span />
          <span />
          <span />
        </span>
      </>
    ) : game.sonarArmed ? (
      t.fleetCommand.sonarPrompt
    ) : (
      t.fleetCommand.yourTurn
    );

  const renderEnemyBoard = () => (
    <div className="fleet-panel">
      <h3 className="fleet-panel-title">{t.fleetCommand.enemyWaters}</h3>
      <div className="fleet-board enemy" role="grid" aria-label={t.fleetCommand.enemyBoardLabel}>
        {enemyMarks.map((mark, i) => (
          <button
            key={i}
            className={`fleet-cell mark-${mark}${sonarCells.has(i) ? " sonar" : ""}${
              game.sonarArmed ? " sonar-aim" : ""
            }`}
            disabled={game.stage !== "player" || (mark !== "none" && !game.sonarArmed)}
            onClick={() => game.fireAt(i)}
            aria-label={t.fleetCommand.enemyCellLabel(
              (i % BOARD_SIZE) + 1,
              Math.floor(i / BOARD_SIZE) + 1,
              mark,
            )}
          >
            {mark === "miss" && "·"}
            {mark === "hit" && "✸"}
            {mark === "sunk" && "☠"}
            {game.playerSonar?.center === i && (
              <b className="sonar-count">{game.playerSonar.count}</b>
            )}
          </button>
        ))}
      </div>
      <p className="fleet-hint">
        {t.fleetCommand.enemyFleetStatus(
          FLEET_LENGTHS.length - enemySunkLengths.length,
          FLEET_LENGTHS.length,
        )}
      </p>
    </div>
  );

  const renderOwnBoard = () => (
    <div className="fleet-panel">
      <h3 className="fleet-panel-title">{t.fleetCommand.yourFleet}</h3>
      <div className="fleet-board own" role="grid" aria-label={t.fleetCommand.yourBoardLabel}>
        {ownMarks.map((mark, i) => (
          <div
            key={i}
            className={`fleet-cell${ownShipCells.has(i) ? " ship" : ""} mark-${mark}${
              game.lastAiShot === i ? " last-shot" : ""
            }`}
            role="gridcell"
            aria-label={t.fleetCommand.ownCellLabel(
              (i % BOARD_SIZE) + 1,
              Math.floor(i / BOARD_SIZE) + 1,
              ownShipCells.has(i),
              mark,
            )}
          >
            {mark === "miss" && "·"}
            {mark === "hit" && "✸"}
            {mark === "sunk" && "☠"}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="card screen fleet-screen">
      <BackLink />

      <div className={`feedback${game.stage === "over" ? (game.won ? " win pop" : " lose pop") : ""}`}>
        {game.stage === "over"
          ? game.won
            ? t.fleetCommand.endWin
            : t.fleetCommand.endLoss
          : feedbackMsg}
      </div>

      <div className="fleet-controls">
        <button
          className={`btn${game.sonarArmed ? " primary" : ""}`}
          disabled={Boolean(game.playerSonar) || game.stage !== "player"}
          aria-pressed={game.sonarArmed}
          onClick={() => game.setSonarArmed(!game.sonarArmed)}
        >
          {game.playerSonar ? t.fleetCommand.sonarSpent : t.fleetCommand.sonarButton}
        </button>
      </div>

      <div className="fleet-tabs" role="tablist">
        <button
          className={`btn${mobileTab === "enemy" ? " primary" : ""}`}
          role="tab"
          aria-selected={mobileTab === "enemy"}
          onClick={() => setMobileTab("enemy")}
        >
          {t.fleetCommand.enemyWaters}
        </button>
        <button
          className={`btn${mobileTab === "fleet" ? " primary" : ""}`}
          role="tab"
          aria-selected={mobileTab === "fleet"}
          onClick={() => setMobileTab("fleet")}
        >
          {t.fleetCommand.yourFleet}
        </button>
      </div>

      <div className={`fleet-boards show-${mobileTab}`}>
        {renderEnemyBoard()}
        {renderOwnBoard()}
      </div>
    </section>
  );
}
