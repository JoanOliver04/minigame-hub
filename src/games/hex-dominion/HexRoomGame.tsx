"use client";

/**
 * Hex Dominion room (PvP) screen — sibling to HexDominionGame.tsx, reusing its
 * hex-board SVG and hex-cell CSS, but driven by useHexRoom's Firestore state.
 * Your stones always render in "your" colour; connect your two edges to win.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { coordinates } from "./logic";
import { useHexRoom } from "./useHexRoom";

const R = 26;
const W = Math.sqrt(3) * R;

function center(i: number) {
  const [r, c] = coordinates(i);
  return { x: 42 + c * W + (r * W) / 2, y: 38 + r * R * 1.5 };
}

function pts(x: number, y: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${x + R * Math.cos(a)},${y + R * Math.sin(a)}`;
  }).join(" ");
}

export function HexRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const c = t.hexDominion;
  const { uid, room, stage, isMyTurn, play, playAgain, leave } = useHexRoom(code);

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
  const myOwner = game.owners[uid];

  if (stage === "finished") {
    const iWon = game.winnerUid === uid;
    const iVoted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen hex-screen">
        <div className="end-emoji">⬡</div>
        <div className={`end-title ${iWon ? "player-win" : "ai-win"}`}>
          {iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{c.movesLabel(game.moves)}</div>
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
  const myGoal = myOwner === "player" ? c.yourGoal : c.aiGoal;
  const oppGoal = myOwner === "player" ? c.aiGoal : c.yourGoal;

  return (
    <section className="card screen hex-screen">
      <div className="hex-status" aria-live="polite">
        {isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?")}
      </div>
      <div className="hex-goal-row">
        <span>← {myGoal} →</span>
        <span>↕ {oppGoal} ↕</span>
      </div>
      <svg className="hex-board" viewBox="0 0 500 330" role="group" aria-label={c.boardLabel}>
        <path className="hex-edge player top" d="M20 15 L355 15" />
        <path className="hex-edge player bottom" d="M145 320 L480 320" />
        <path className="hex-edge ai left" d="M20 20 L145 315" />
        <path className="hex-edge ai right" d="M355 20 L480 315" />
        {game.board.map((owner, i) => {
          const { x, y } = center(i);
          const [r, col] = coordinates(i);
          const cls = owner ? (owner === myOwner ? "player" : "ai") : "empty";
          const canPlay = isMyTurn && !owner;
          return (
            <polygon
              key={i}
              points={pts(x, y)}
              className={`hex-cell ${cls}`}
              role="button"
              tabIndex={canPlay ? 0 : -1}
              aria-disabled={!canPlay}
              aria-label={owner ? c.ownedCell(r + 1, col + 1, owner) : c.emptyCell(r + 1, col + 1)}
              onClick={() => play(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  play(i);
                }
              }}
            />
          );
        })}
      </svg>
      <div className="hex-legend">
        <span><i className="player" />{c.youLegend}</span>
        <span><i className="ai" />{opponentName}</span>
      </div>
      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
