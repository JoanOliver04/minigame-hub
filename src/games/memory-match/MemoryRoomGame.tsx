"use client";

/**
 * Memory Match room (PvP) screen — sibling to MemoryMatchGame.tsx, reusing
 * its memory-board/memory-tile CSS, but driven by useMemoryRoom's
 * Firestore-backed state instead of the local AI.
 */

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useMemoryRoom } from "./useMemoryRoom";

type MemoryBoardStyle = CSSProperties & { "--memory-columns": number };

export function MemoryRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, canFlip, flip, playAgain, leave } = useMemoryRoom(code);

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
  const myScore = game.scores[uid] ?? 0;
  const opponentScore = game.scores[opponentUid] ?? 0;

  if (stage === "finished") {
    const tie = myScore === opponentScore;
    const iWon = myScore > opponentScore;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{iWon ? "🏆" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie
            ? t.memoryRoom.tieTitle
            : iWon
              ? t.rooms.matchWinYou
              : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myScore, opponentScore)}</div>
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
  const nameFor = (id: string) => (id === uid ? t.memoryRoom.youWord : opponentName ?? "?");
  const turnMsg = isMyTurn ? t.memoryRoom.yourTurn : t.memoryRoom.opponentTurn(opponentName ?? "?");
  let resultMsg: string | null = null;
  let resultClass = "";
  if (game.lastResult) {
    const who = nameFor(game.lastResult.uid);
    if (game.lastResult.kind === "match") {
      resultMsg = t.memoryRoom.matchBy(who);
      resultClass = game.lastResult.uid === uid ? " win" : " lose";
    } else {
      resultMsg = t.memoryRoom.missBy(who);
      resultClass = " high";
    }
  }

  return (
    <section className="card screen memory-screen">
      <div className="rps-tally">
        <span className="you">{t.memoryRoom.tallyYou(myScore)}</span>
        <span className="goal">{t.memoryRoom.pairsLeft(game.tiles.filter((tile) => !tile.isSolved).length / 2)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">{turnMsg}</div>
      {resultMsg && <div className={`feedback${resultClass}`}>{resultMsg}</div>}

      <div
        className={`memory-board size-${game.size}`}
        style={{ "--memory-columns": game.size } as MemoryBoardStyle}
      >
        {game.tiles.map((tile, index) => {
          const visible = tile.isFlipped || tile.isSolved;
          return (
            <button
              key={tile.id}
              className={`memory-tile${visible ? " flipped" : ""}${tile.isSolved ? " solved" : ""}`}
              disabled={!canFlip || visible}
              onClick={() => flip(index)}
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

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
