"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { ColorPicker, PrismCardFace } from "./PrismCardFace";
import { legalCardIndexes, PRISM_COLORS } from "./logic";
import type { PrismCard, PrismColor } from "./types";
import { usePrismRoom } from "./usePrismRoom";

export function PrismRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const {
    uid,
    room,
    stage,
    isMyTurn,
    pendingPrism,
    setPendingPrism,
    play,
    draw,
    playAgain,
    leave,
  } = usePrismRoom(code);

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
  if (stage === "error") {
    return <section className="card screen"><p>{t.rooms.errorGeneric}</p></section>;
  }

  const opponentUid = Object.keys(room.players).find((id) => id !== uid);
  const opponentName = opponentUid ? room.players[opponentUid]?.name : undefined;
  if (stage === "waiting" || !opponentUid) {
    return (
      <section className="card screen prism-screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const game = room.game;
  const myScore = game.scores[uid] ?? 0;
  const opponentScore = game.scores[opponentUid] ?? 0;
  if (stage === "finished") {
    const won = game.winner === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen prism-screen">
        <div className="end-emoji">{won ? "🏆" : "🤝"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myScore, opponentScore)}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>
            {voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const hand = game.hands[uid] ?? [];
  const opponentHand = game.hands[opponentUid] ?? [];
  const legal = legalCardIndexes(game, uid);
  const top = game.discardPile[game.discardPile.length - 1];
  const action = game.lastAction;
  const actorName = action?.actor === uid ? t.common.you : opponentName ?? "?";
  let feedback = isMyTurn ? t.rooms.turnYours : t.rooms.turnOpponent(opponentName ?? "?");
  if (action) {
    if (action.kind === "draw") feedback = t.prismClash.actionDraw(actorName);
    if (action.kind === "combo") feedback = t.prismClash.actionCombo(actorName);
    if (action.kind === "freeze") feedback = t.prismClash.actionFreeze(actorName);
    if (action.kind === "draw2") feedback = t.prismClash.actionDraw2(actorName);
    if (action.kind === "prism" && action.color) {
      feedback = t.prismClash.actionPrism(actorName, t.prismClash.colors[action.color]);
    }
    if (action.kind === "roundWin") feedback = t.prismClash.roundWin(actorName);
  }

  const cardLabel = (card: PrismCard) =>
    t.prismClash.cardLabel(
      card.kind,
      card.color ? t.prismClash.colors[card.color] : "",
      card.value,
    );

  function selectCard(index: number) {
    const selected = hand[index];
    if (!isMyTurn || !legal.includes(index)) return;
    if (selected.kind === "prism") setPendingPrism(index);
    else play(index);
  }

  return (
    <section className="card screen prism-screen">
      <div className="rps-tally">
        <span className="you">{t.prismClash.scoreYou(myScore)}</span>
        <span className="goal">{t.prismClash.firstTo(game.target)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>
      <div className="prism-opponent">
        <div className="prism-player-line">
          <strong>{opponentName}</strong><span>{t.prismClash.cardsCount(opponentHand.length)}</span>
        </div>
        <div className="prism-back-fan" aria-label={t.prismClash.opponentHand}>
          {opponentHand.slice(0, 10).map((card) => (
            <PrismCardFace key={card.id} label={t.prismClash.hiddenCard} />
          ))}
          {opponentHand.length > 10 && <b>+{opponentHand.length - 10}</b>}
        </div>
      </div>
      <div className="feedback prism-feedback">{feedback}</div>
      <div className="prism-table">
        <button
          type="button"
          className="prism-deck"
          disabled={!isMyTurn || legal.length > 0 || pendingPrism !== null}
          onClick={draw}
          aria-label={t.prismClash.drawCard}
        >
          <PrismCardFace label={t.prismClash.drawPile} /><span>{game.drawPile.length}</span>
        </button>
        <div className="prism-discard"><PrismCardFace card={top} label={cardLabel(top)} /></div>
        <div className={`prism-active ${game.activeColor}`}>
          <span /> {t.prismClash.activeColor(t.prismClash.colors[game.activeColor])}
        </div>
      </div>
      {pendingPrism !== null && (
        <ColorPicker
          colors={PRISM_COLORS}
          label={t.prismClash.chooseColor}
          colorLabel={(color: PrismColor) => t.prismClash.colors[color]}
          onPick={(color) => play(pendingPrism, color)}
        />
      )}
      <div className="prism-player-line">
        <strong>{t.common.you}</strong><span>{t.prismClash.cardsCount(hand.length)}</span>
      </div>
      <div className="prism-hand" aria-label={t.prismClash.yourHand}>
        {hand.map((card, index) => (
          <PrismCardFace
            key={card.id}
            card={card}
            label={cardLabel(card)}
            selected={pendingPrism === index}
            disabled={!isMyTurn || !legal.includes(index) || pendingPrism !== null}
            onClick={() => selectCard(index)}
          />
        ))}
      </div>
      <div className="btn-row">
        <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
      </div>
    </section>
  );
}
