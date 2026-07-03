"use client";

/**
 * TTT room (PvP) screen — sibling to TttGame.tsx, reusing its CSS classes
 * (rps-tally/ttt-board/ttt-cell/feedback) so the two modes look consistent,
 * but driven by useTttRoom's Firestore-backed state instead of local AI.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useTttRoom } from "./useTttRoom";

export function TttRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, selectedCell, handleCell, playAgain, leave } = useTttRoom(code);

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
  const myMark = game.marks[uid];

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
            <div className="label">{t.ttt.draws}</div>
            <div className="value">{game.draws}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.common.roundsPlayed}</div>
            <div className="value">{game.rounds}</div>
          </div>
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
  const myTurn = game.turn === uid;
  const opponentMark = game.marks[opponentUid];
  const myCellCount = game.board.filter((cell) => cell === myMark).length;

  let feedbackMsg: string;
  if (!myTurn) {
    feedbackMsg = t.rooms.turnOpponent(opponentName ?? "?");
  } else if (myCellCount === 3 && selectedCell === null) {
    feedbackMsg = t.ttt.choosePiece;
  } else if (selectedCell !== null) {
    feedbackMsg = t.ttt.chooseDestination;
  } else {
    feedbackMsg = t.rooms.turnYours;
  }

  let lastRoundMsg: string | null = null;
  if (game.lastOutcome) {
    lastRoundMsg = game.lastOutcome.winner === null
      ? t.rooms.roundResultTie
      : game.lastOutcome.winner === myMark
        ? t.rooms.roundResultWin
        : t.rooms.roundResultLose;
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.ttt.tallyYou(myScore)}</span>
        <span className="goal">{t.ttt.tallyGoal(game.target, game.draws)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="feedback">{feedbackMsg}</div>
      {lastRoundMsg && <div className="feedback">{lastRoundMsg}</div>}

      <div className="ttt-board">
        {game.board.map((cell, i) => {
          const isSelected = selectedCell === i;
          const canInteract =
            myTurn &&
            (myCellCount < 3
              ? cell === null
              : selectedCell === null
                ? cell === myMark
                : cell !== opponentMark);
          return (
            <button
              key={i}
              className={`ttt-cell${isSelected ? " selected" : ""}${canInteract && cell === myMark ? " movable" : ""}`}
              disabled={!canInteract}
              onClick={() => handleCell(i)}
              aria-pressed={isSelected}
              aria-label={t.ttt.cellLabel(i + 1, cell)}
            >
              {cell && <span className={`mark ${cell === "X" ? "x" : "o"}`}>{cell}</span>}
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
