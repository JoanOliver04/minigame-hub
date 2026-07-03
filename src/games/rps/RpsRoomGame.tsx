"use client";

/**
 * RPS room (PvP) screen — sibling to RpsGame.tsx, reusing its CSS classes
 * (rps-tally/rps-arena/rps-choices/log) so the two modes look consistent,
 * but driven by useRpsRoom's Firestore-backed state instead of local AI.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { MOVES, MOVE_EMOJI, type Move } from "./logic";
import { useRpsRoom } from "./useRpsRoom";

export function RpsRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, hasSubmitted, playMove, playAgain, leave } = useRpsRoom(code);

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
    const iWon = myScore > opponentScore;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{iWon ? "🏆" : "🤝"}</div>
        <div className={`end-title ${iWon ? "player-win" : "ai-win"}`}>
          {iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
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
  const MOVE_LABEL: Record<Move, string> = t.rps.moveLabels;
  const myMove = game.pendingMoves[uid];

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.rps.tallyYou(myScore)}</span>
        <span className="goal">{t.rps.tallyGoal(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className="rps-arena">
        <div className="rps-hand player-side">{myMove ? MOVE_EMOJI[myMove] : "✊"}</div>
        <div className="rps-vs">VS</div>
        <div className="rps-hand ai-side">{game.pendingMoves[opponentUid] ? "✅" : "✊"}</div>
      </div>

      <div className="feedback">
        {hasSubmitted ? t.rooms.submittedWaiting : t.rps.pickMove}
      </div>

      <div className="rps-choices">
        {MOVES.map((move) => (
          <button
            key={move}
            className="rps-choice"
            disabled={hasSubmitted}
            onClick={() => playMove(move)}
          >
            <span className="emoji">{MOVE_EMOJI[move]}</span>
            <span className="label">{MOVE_LABEL[move]}</span>
          </button>
        ))}
      </div>

      <div className="log-title">{t.rps.logTitle}</div>
      <ul className="log">
        {game.history.map((entry) => {
          const myEntryMove = entry.moves[uid];
          const opponentEntryMove = entry.moves[opponentUid];
          const myResult = entry.result[uid];
          return (
            <li
              key={entry.id}
              className={myResult === "win" ? "player" : myResult === "lose" ? "ai" : ""}
            >
              <span className="mv">
                {MOVE_EMOJI[myEntryMove]} {MOVE_LABEL[myEntryMove]}
              </span>
              <span className="verdict" style={{ flex: "none" }}>
                vs
              </span>
              <span className="mv">
                {MOVE_EMOJI[opponentEntryMove]} {MOVE_LABEL[opponentEntryMove]}
              </span>
              <span className={`verdict ${myResult}`}>
                {myResult === "win"
                  ? t.rooms.roundResultWin
                  : myResult === "lose"
                    ? t.rooms.roundResultLose
                    : t.rooms.roundResultTie}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
