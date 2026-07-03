"use client";

/**
 * Fleet Command room (PvP) screen — sibling to FleetCommandGame.tsx, reusing
 * its fleet-board/fleet-cell CSS, but driven by useFleetRoom's Firestore-backed
 * state. Two-player Battleship: place a fleet, then take turns firing.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { BOARD_SIZE } from "./types";
import type { ShotRecord } from "./types";
import { useFleetRoom } from "./useFleetRoom";

type Mark = "miss" | "hit" | "sunk";

/** Build an index→mark map from a shooter's shot history (sunk reveals cells). */
function marksFromShots(shots: ShotRecord[]): Map<number, Mark> {
  const marks = new Map<number, Mark>();
  for (const shot of shots) {
    marks.set(shot.index, shot.result);
    if (shot.result === "sunk" && shot.sunkCells) {
      for (const cell of shot.sunkCells) marks.set(cell, "sunk");
    }
  }
  return marks;
}

export function FleetRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, shuffle, ready, fire, playAgain, leave } = useFleetRoom(code);

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
  const myShipCells = new Set((game.fleets[uid] ?? []).flatMap((ship) => ship.cells));
  const incomingMarks = marksFromShots(game.shots[opponentUid] ?? []); // opponent's shots at me
  const outgoingMarks = marksFromShots(game.shots[uid] ?? []); // my shots at opponent

  const ownBoard = (
    <div className="fleet-panel">
      <div className="fleet-panel-title">{t.fleetRoom.yourFleet}</div>
      <div className="fleet-board own">
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
          const mark = incomingMarks.get(i);
          const cls = ["fleet-cell"];
          if (myShipCells.has(i)) cls.push("ship");
          if (mark) cls.push(`mark-${mark}`);
          return <span key={i} className={cls.join(" ")} />;
        })}
      </div>
    </div>
  );

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen fleet-screen">
        <div className="end-emoji">{iWon ? "🏆" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : "ai-win"}`}>
          {iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
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

  /* ================= PLACING ================= */
  if (game.phase === "placing") {
    const iAmReady = game.ready[uid];
    return (
      <section className="card screen fleet-screen">
        <div className="end-title">{t.fleetRoom.placingTitle}</div>
        <div className="feedback">{iAmReady ? t.fleetRoom.readyWaiting : t.fleetRoom.placingHint}</div>
        {ownBoard}
        <div className="btn-row">
          <button className="btn" disabled={iAmReady} onClick={shuffle}>
            {t.fleetRoom.shuffle}
          </button>
          <button className="btn primary" disabled={iAmReady} onClick={ready}>
            {t.fleetRoom.ready}
          </button>
          <button className="btn" onClick={leave}>
            {t.rooms.leaveButton}
          </button>
        </div>
      </section>
    );
  }

  /* ================= FIRING ================= */
  let feedback = isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?");
  if (game.lastShot) {
    const who = game.lastShot.uid === uid ? t.fleetRoom.youWord : opponentName ?? "?";
    feedback = t.fleetRoom.shotResult(who, game.lastShot.result);
  }

  return (
    <section className="card screen fleet-screen">
      <div className="feedback">{feedback}</div>

      <div className="fleet-boards">
        <div className="fleet-panel">
          <div className="fleet-panel-title">{t.fleetRoom.enemyWaters}</div>
          <div className="fleet-board">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
              const mark = outgoingMarks.get(i);
              const cls = ["fleet-cell"];
              if (mark) cls.push(`mark-${mark}`);
              if (game.lastShot?.uid === uid && game.lastShot.index === i) cls.push("last-shot");
              return (
                <button
                  key={i}
                  className={cls.join(" ")}
                  disabled={!isMyTurn || Boolean(mark)}
                  onClick={() => fire(i)}
                  aria-label={t.fleetRoom.cellLabel(i)}
                >
                  {mark === "miss" ? "•" : mark === "hit" ? "✕" : mark === "sunk" ? "✕" : ""}
                </button>
              );
            })}
          </div>
        </div>
        {ownBoard}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
