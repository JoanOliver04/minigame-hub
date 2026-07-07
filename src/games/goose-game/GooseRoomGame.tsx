"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { GooseBoard } from "./GooseBoard";
import type { GooseSpecial } from "./types";
import { useGooseRoom } from "./useGooseRoom";

const DIE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function GooseRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, isMyTurn, roll, reroll, move, playAgain, leave } = useGooseRoom(code);

  if (stage === "connecting") return <section className="card screen"><p>{t.rooms.connecting}</p></section>;
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
      <section className="card screen goose-screen">
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
      <section className="card end-card screen goose-screen">
        <div className="end-emoji">{won ? "🏆" : "🪿"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.gooseGame.goalReached}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>
            {voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const canRoll = isMyTurn && game.die === null;
  const canMove = isMyTurn && game.die !== null;
  const canReroll = canMove && !game.rerolled && game.feathers[uid] > 0;
  const action = game.lastAction;
  const actor = action?.actor === uid ? t.common.you : opponentName ?? "?";
  let feedback = isMyTurn
    ? game.die === null
      ? t.gooseGame.yourRoll
      : t.gooseGame.chooseRoll(game.die)
    : t.rooms.turnOpponent(opponentName ?? "?");
  if (action?.kind === "reroll") feedback = t.gooseGame.rerolled(actor, action.roll);
  if (action?.kind === "move" && action.special) {
    feedback = t.gooseGame.specialFeedback[action.special](actor, action.to ?? 0);
  } else if (action?.kind === "move") {
    feedback = t.gooseGame.moved(actor, action.to ?? 0);
  }
  if (action?.swappedWith) feedback += ` ${t.gooseGame.swapped(actor)}`;

  const specialLabel = (special?: GooseSpecial) =>
    special ? t.gooseGame.specialNames[special] : undefined;

  return (
    <section className="card screen goose-screen">
      <div className="goose-score">
        <div className="player">
          <strong>{t.common.you}</strong>
          <span>{t.gooseGame.squareStatus(game.positions[uid])}</span>
          <small>{t.gooseGame.feathers(game.feathers[uid])}</small>
        </div>
        <div className="rival">
          <strong>{opponentName}</strong>
          <span>{t.gooseGame.squareStatus(game.positions[opponentUid])}</span>
          <small>{t.gooseGame.feathers(game.feathers[opponentUid])}</small>
        </div>
      </div>
      <div className="feedback goose-feedback">{feedback}</div>
      <GooseBoard
        state={game}
        viewer={uid}
        boardLabel={t.gooseGame.boardLabel}
        squareLabel={(square, special) => t.gooseGame.squareLabel(square, specialLabel(special))}
        tokenLabel={(actorId, square) =>
          t.gooseGame.tokenLabel(actorId === uid ? t.common.you : opponentName ?? "?", square)}
      />
      <div className="goose-controls">
        <div className={`goose-die${game.die ? " rolled" : ""}`}>
          {game.die ? DIE_FACES[game.die] : "?"}
        </div>
        <div className="btn-row">
          <button className="btn primary" disabled={!canRoll} onClick={roll}>{t.gooseGame.rollDice}</button>
          <button className="btn primary" disabled={!canMove} onClick={move}>
            {game.die ? t.gooseGame.moveButton(game.die) : t.gooseGame.move}
          </button>
          <button className="btn feather" disabled={!canReroll} onClick={reroll}>
            🪶 {t.gooseGame.useFeather}
          </button>
        </div>
      </div>
      <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
    </section>
  );
}
