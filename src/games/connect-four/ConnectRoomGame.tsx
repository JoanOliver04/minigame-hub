"use client";

/**
 * Connect Four room (PvP) screen — sibling to ConnectFourGame.tsx, reusing
 * its connect-board/connect-column/connect-slot/connect-piece CSS, but driven
 * by useConnectRoom's Firestore-backed state instead of the local minimax AI.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { ConnectGrid, RoundReview } from "./ConnectGrid";
import { toBoard, type ConnectRoomGame } from "./room";
import { useConnectRoom } from "./useConnectRoom";

export function ConnectRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, playColumn, playAgain, leave } = useConnectRoom(code);

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

  const game: ConnectRoomGame = room.game;
  const myScore = game.scores[uid] ?? 0;
  const opponentScore = game.scores[opponentUid] ?? 0;
  const myPiece = game.pieces[uid];
  const opponent = opponentName ?? "?";

  if (stage === "finished") {
    const iWon = myScore > opponentScore;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{iWon ? "🏆" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : "ai-win"}`}>
          {iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myScore, opponentScore)}</div>
        <div className="end-stats">
          <div className="stat-box neutral">
            <div className="label">{t.connectFour.draws}</div>
            <div className="value">{game.draws}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.common.roundsPlayed}</div>
            <div className="value">{game.rounds}</div>
          </div>
        </div>
        <RoundReview round={game.rounds} board={toBoard(game.cells)} myPiece={myPiece} opponent={opponent} outcome={game.lastOutcome} />
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
  const board = toBoard(game.cells);

  const feedback = isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?");

  let lastRoundMsg: string | null = null;
  if (game.lastOutcome) {
    const o = game.lastOutcome;
    lastRoundMsg = o.draw
      ? t.rooms.roundResultTie
      : o.winner === myPiece
        ? t.rooms.roundResultWin
        : t.rooms.roundResultLose;
  }

  return (
    <section className="card screen connect-screen">
      <div className="rps-tally">
        <span className="you">{t.connectFour.tallyYou(myScore)}</span>
        <span className="goal">{t.connectFour.tallyGoal(game.target, game.draws)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback" role="status">{feedback}</div>
      <ConnectGrid board={board} myPiece={myPiece} opponent={opponent} canPlay={isMyTurn} onPlay={playColumn} />
      {lastRoundMsg && <p>{lastRoundMsg}</p>}
      {game.previousCells && <RoundReview key={game.rounds} round={game.rounds} board={toBoard(game.previousCells)}
        myPiece={myPiece} opponent={opponent} outcome={game.lastOutcome} />}

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
