"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { legalParchisMoves } from "./logic";
import { ParchisBoard } from "./ParchisBoard";
import { useParchisRoom } from "./useParchisRoom";

function Dice({ value }: { value: number | null }) {
  const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return <div className={`parchis-die${value ? " rolled" : ""}`} aria-hidden="true">{value ? faces[value] : "?"}</div>;
}

export function ParchisRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, roll, move, playAgain, leave } = useParchisRoom(code);

  if (stage === "connecting") {
    return <section className="card screen"><p>{t.rooms.connecting}</p></section>;
  }
  if (stage === "gone" || stage === "expired" || !room || !uid) {
    const message =
      stage === "expired" ? t.rooms.roomExpired : stage === "gone" ? t.rooms.roomGone : t.rooms.roomNotFound;
    return (
      <section className="card screen">
        <p>{message}</p>
        <Link href="/rooms" className="btn primary">{t.rooms.backToRooms}</Link>
      </section>
    );
  }
  if (stage === "error") return <section className="card screen"><p>{t.rooms.errorGeneric}</p></section>;

  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;
  if (stage === "waiting" || !opponentUid) {
    return (
      <section className="card screen parchis-screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const game = room.game;
  if (stage === "finished") {
    const won = game.winner === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen parchis-screen">
        <div className="end-emoji">{won ? "🏆" : "🤝"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.parchis.finishedCount(game.pieceCount)}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>
            {voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const legal = legalParchisMoves(game, uid);
  const canRoll = isMyTurn && game.pendingSteps === null;
  const action = game.lastAction;
  const actor = action?.actor === uid ? t.common.you : opponentName ?? "?";
  let feedback = isMyTurn ? (canRoll ? t.parchis.yourRoll : t.parchis.choosePiece) : t.rooms.turnOpponent(opponentName ?? "?");
  if (game.pendingSource === "capture") feedback = t.parchis.chooseBonus(20);
  if (game.pendingSource === "goal") feedback = t.parchis.chooseBonus(10);
  if (action?.kind === "capture") feedback = t.parchis.captured(actor);
  if (action?.kind === "goal") feedback = t.parchis.reachedGoal(actor);
  if (action?.kind === "tripleSix") feedback = t.parchis.tripleSix(actor);
  if (action?.kind === "blocked") feedback = t.parchis.noMove(actor);

  const status = (actorId: string) => {
    const home = game.pieces[actorId].filter((piece) => piece.progress === -1).length;
    const goal = game.pieces[actorId].filter((piece) => piece.progress === 75).length;
    return t.parchis.pieceStatus(home, goal);
  };

  return (
    <section className="card screen parchis-screen">
      <div className="parchis-score">
        <div className={game.colors[uid]}><strong>{t.common.you}</strong><span>{status(uid)}</span></div>
        <div className={game.colors[opponentUid]}><strong>{opponentName}</strong><span>{status(opponentUid)}</span></div>
      </div>
      <div className="feedback parchis-feedback">{feedback}</div>
      <ParchisBoard
        state={game}
        viewer={uid}
        legal={legal}
        boardLabel={t.parchis.boardLabel}
        pieceLabel={(mine, piece, pieceStatus) =>
          t.parchis.pieceLabel(
            mine ? t.common.you : opponentName ?? "?",
            piece,
            t.parchis.pieceStatuses[pieceStatus],
          )}
        onMove={move}
      />
      <div className="parchis-controls">
        <Dice value={game.dice} />
        <div>
          <button className="btn primary parchis-roll" disabled={!canRoll} onClick={roll}>
            {t.parchis.rollDice}
          </button>
          <small>
            {game.pendingSteps !== null
              ? t.parchis.moveSteps(game.pendingSteps)
              : isMyTurn
                ? t.parchis.rollPrompt
                : t.parchis.waitPrompt}
          </small>
        </div>
      </div>
      <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
    </section>
  );
}
