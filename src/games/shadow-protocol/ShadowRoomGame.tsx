"use client";

/**
 * Shadow Protocol room (PvP) screen — a score-attack duel on a shared facility
 * (see room.ts). Reuses the solo game's shadow-board/shadow-hud/shadow-actions
 * CSS and board rendering, driven by useShadowRoom's local engine. When you
 * finish (escape or caught) it waits for your opponent, then shows who scored
 * higher on the same map.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { ALARM_TURNS } from "./logic";
import type { Position, ShadowState } from "./types";
import { samePos } from "./types";
import { CAMERA_VISION_RANGE, DIR_CYCLE, GUARD_VISION_RANGE, visibleTiles } from "./visibility";
import { useShadowRoom } from "./useShadowRoom";

const DIR_ARROWS: Record<string, string> = { n: "↑", e: "→", s: "↓", w: "←" };

function visionUnion(state: ShadowState): Set<number> {
  const seen = new Set<number>();
  for (const guard of state.guards) {
    for (const pos of visibleTiles(state.tiles, state.width, state.height, guard.pos, guard.facing, GUARD_VISION_RANGE)) {
      seen.add(pos.y * state.width + pos.x);
    }
  }
  for (const camera of state.cameras) {
    if (camera.disabledFor > 0) continue;
    for (const pos of visibleTiles(state.tiles, state.width, state.height, camera.pos, DIR_CYCLE[camera.dirIndex], CAMERA_VISION_RANGE)) {
      seen.add(pos.y * state.width + pos.x);
    }
  }
  return seen;
}

export function ShadowRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, local, armed, setArmed, submitted, hackAvailable, beaconSpots, tapTile, act, playAgain, leave } =
    useShadowRoom(code);

  const visible = useMemo(() => (local ? visionUnion(local) : new Set<number>()), [local]);
  const beaconSet = useMemo(
    () => new Set(beaconSpots.map((pos: Position) => pos.y * (local?.width ?? 11) + pos.x)),
    [beaconSpots, local],
  );

  if (stage === "connecting") {
    return (
      <section className="card screen">
        <p>{t.rooms.connecting}</p>
      </section>
    );
  }

  if (stage === "gone" || stage === "expired" || !room || !uid) {
    const message =
      stage === "expired" ? t.rooms.roomExpired : stage === "gone" ? t.rooms.roomGone : t.rooms.roomNotFound;
    return (
      <section className="card screen">
        <p>{message}</p>
        <div className="btn-row">
          <Link href="/rooms" className="btn primary">
            {t.rooms.backToRooms}
          </Link>
        </div>
      </section>
    );
  }

  if (stage === "error") {
    return (
      <section className="card screen">
        <p>{t.rooms.errorGeneric}</p>
      </section>
    );
  }

  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;

  if (stage === "waiting" || !opponentUid) {
    return (
      <section className="card screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row">
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  const game = room.game;

  if (stage === "finished") {
    const mine = game.results[uid];
    const theirs = opponentUid ? game.results[opponentUid] : undefined;
    const iWon = game.winnerUid === uid;
    const tie = game.winnerUid === null;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen shadow-screen">
        <div className="end-emoji">{iWon ? "🕶️" : tie ? "🤝" : "🚨"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.shadowRoom.tieTitle : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">
          {t.shadowRoom.scoreLine(mine?.score ?? 0, theirs?.score ?? 0)}
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={iVoted}>
            {iVoted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  /* ================= PLAYING ================= */
  // Finished my run, opponent still going.
  if (submitted || !local) {
    const mine = game.results[uid];
    const outcomeMsg = mine
      ? mine.escaped
        ? t.shadowRoom.youEscaped(mine.score)
        : t.shadowRoom.youCaught
      : t.rooms.connecting;
    return (
      <section className="card screen shadow-screen">
        <div className="feedback">{outcomeMsg}</div>
        <div className="feedback">{t.shadowRoom.waitingOpponent}</div>
        <div className="btn-row">
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card screen shadow-screen">
      <div className="shadow-hud">
        <span className="shadow-hud-item">{t.shadowProtocol.turnLabel(local.turn)}</span>
        <span className={`shadow-hud-item${local.hasCore ? " has-core" : ""}`}>
          {local.hasCore ? t.shadowProtocol.coreCollected : t.shadowProtocol.coreMissing}
        </span>
        <span className={`shadow-hud-item alarm${local.detectedEver ? " active" : ""}`} aria-live="polite">
          {t.shadowProtocol.alarmLabel(local.alarmRemaining, ALARM_TURNS)}
        </span>
      </div>

      <div className="feedback" aria-live="polite">
        {local.spotted ? t.shadowProtocol.statusSpotted(local.alarmRemaining) : t.shadowProtocol.statusSneak}
      </div>

      <div className="shadow-board" role="grid" aria-label={t.shadowProtocol.boardLabel}>
        {local.tiles.map((tile, i) => {
          const x = i % local.width;
          const y = Math.floor(i / local.width);
          const pos = { x, y };
          const isPlayer = samePos(local.player, pos);
          const guard = local.guards.find((g) => samePos(g.pos, pos));
          const camera = local.cameras.find((c) => samePos(c.pos, pos));
          const classes = ["shadow-tile", `t-${tile}`];
          if (visible.has(i)) classes.push("seen");
          if (armed === "beacon" && beaconSet.has(i)) classes.push("beacon-target");
          if (isPlayer) classes.push("player-here");
          return (
            <button
              key={i}
              className={classes.join(" ")}
              onClick={() => tapTile(pos)}
              aria-label={t.shadowProtocol.cellLabel(x, y, tile, isPlayer, Boolean(guard), Boolean(camera), visible.has(i))}
            >
              {isPlayer && <span className="actor you">🥷</span>}
              {guard && (
                <span className={`actor guard mode-${guard.mode}`}>
                  💂<i className="facing">{DIR_ARROWS[guard.facing]}</i>
                </span>
              )}
              {camera && (
                <span className={`actor camera${camera.disabledFor > 0 ? " off" : ""}`}>
                  📷{camera.disabledFor === 0 && <i className="facing">{DIR_ARROWS[DIR_CYCLE[camera.dirIndex]]}</i>}
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
        <button className={`btn${armed === "sprint" ? " primary" : ""}`} aria-pressed={armed === "sprint"} onClick={() => setArmed(armed === "sprint" ? "none" : "sprint")}>
          {t.shadowProtocol.actionSprint}
        </button>
        <button className={`btn${armed === "beacon" ? " primary" : ""}`} aria-pressed={armed === "beacon"} disabled={local.beaconUsed && armed !== "beacon"} onClick={() => setArmed(armed === "beacon" ? "none" : "beacon")}>
          {t.shadowProtocol.actionBeacon}
        </button>
      </div>

      <div className="shadow-dpad" aria-label={t.shadowProtocol.dpadLabel}>
        <button className="btn" onClick={() => tapTile({ x: local.player.x, y: local.player.y - 1 })}>↑</button>
        <div>
          <button className="btn" onClick={() => tapTile({ x: local.player.x - 1, y: local.player.y })}>←</button>
          <button className="btn" onClick={() => tapTile({ x: local.player.x, y: local.player.y + 1 })}>↓</button>
          <button className="btn" onClick={() => tapTile({ x: local.player.x + 1, y: local.player.y })}>→</button>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
