"use client";

/**
 * Hex Dominion room (PvP) screen — sibling to HexDominionGame.tsx, reusing its
 * hex-board SVG and hex-cell CSS, but driven by useHexRoom's Firestore state.
 * Your stones always render in "your" colour; connect your two edges to win.
 */

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { HexBoard } from "./HexBoard";
import { useHexRoom } from "./useHexRoom";

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
        <HexBoard board={game.board} viewer={myOwner} opponent={opponentName ?? "?"}
          winner={game.winnerUid ? game.owners[game.winnerUid] : null} />
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
  return (
    <section className="card screen hex-screen">
      <div className="hex-status" aria-live="polite">
        {isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?")}
      </div>
      <HexBoard board={game.board} viewer={myOwner} opponent={opponentName ?? "?"} onPlay={isMyTurn ? play : undefined} />
      <div className="btn-row">
        <button className="btn" onClick={leave}>
          {t.rooms.leaveButton}
        </button>
      </div>
    </section>
  );
}
