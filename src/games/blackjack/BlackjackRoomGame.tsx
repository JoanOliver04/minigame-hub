"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { CardFace } from "../higher-or-lower/CardFace";
import { calculateHandValue } from "./logic";
import { useBlackjackRoom } from "./useBlackjackRoom";

export function BlackjackRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, hit, stand, playAgain, leave } = useBlackjackRoom(code);

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
      <section className="card screen">
        <div className="end-title">{t.rooms.waitingTitle}</div>
        <div className="end-number">{room.code}</div>
        <p>{t.rooms.shareCode(room.code)}</p>
        <p>{t.rooms.waitingHint}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const game = room.game;
  const myMatch = game.matches[uid];
  const opponentMatch = game.matches[opponentUid];
  const myScore = myMatch?.youScore ?? 0;
  const opponentScore = opponentMatch?.youScore ?? 0;

  if (stage === "finished") {
    const tie = game.winnerUid === null;
    const iWon = game.winnerUid === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{tie ? "🤝" : iWon ? "🏆" : "🤖"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myScore, opponentScore)}</div>
        <div className="end-stats">
          <div className="stat-box neutral">
            <div className="label">{t.blackjack.pushes}</div>
            <div className="value">{myMatch?.pushes ?? 0}</div>
          </div>
          <div className="stat-box neutral">
            <div className="label">{t.common.roundsPlayed}</div>
            <div className="value">{myMatch?.rounds ?? 0}</div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>
            {voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  const seat = game.seats[uid];
  const opponentSeat = game.seats[opponentUid];
  const myHand = seat?.playerCards ?? [];
  const dealerHand = seat?.dealerCards ?? [];
  const myValue = calculateHandValue(myHand);
  const dealerValue = calculateHandValue(dealerHand);
  const busy = !seat || seat.ready || Boolean(seat.outcome) || myValue.isBust;
  const hitDisabled = busy || myValue.isBlackjack;

  const totalText = (value: ReturnType<typeof calculateHandValue>) =>
    value.isBlackjack ? t.blackjack.blackjackLabel : t.blackjack.totalLabel(value.total, value.isSoft, value.isBust);

  let feedback = seat?.ready ? t.rooms.submittedWaiting : t.blackjack.yourTurn;
  let feedbackClass = "";
  if (seat?.outcome) {
    const outcome = seat.outcome.result;
    feedback =
      outcome === "win"
        ? t.blackjack.winRound(seat.outcome.playerBlackjack)
        : outcome === "lose"
          ? t.blackjack.loseRound
          : t.blackjack.pushRound;
    feedbackClass = outcome === "win" ? " win" : outcome === "lose" ? " lose" : " tie";
  }

  return (
    <section className="card screen">
      <div className="rps-tally">
        <span className="you">{t.blackjack.tallyYou(myScore)}</span>
        <span className="goal">{t.blackjack.tallyGoal(game.config.target, myMatch?.pushes ?? 0)}</span>
        <span className="them">{opponentName}: {opponentScore}</span>
      </div>

      <div className={`feedback${feedbackClass}`}>{feedback}</div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading ai">
          <span className="who">{opponentName}</span>
          <span className="bj-hand-total">
            {opponentSeat?.ready ? t.rooms.submittedWaiting : t.blackjack.yourTurn}
          </span>
        </div>
        <div className="bj-hand-cards">
          {(opponentSeat?.playerCards ?? []).map((card) => (
            <CardFace key={card.id} card={card} flipping hidden label={opponentName ?? "?"} />
          ))}
        </div>
      </div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading ai">
          <span className="who">{t.blackjack.dealerLabel}</span>
          {dealerHand.length > 0 && !seat?.holeHidden && (
            <span className={`bj-hand-total${dealerValue.isBust ? " bust" : ""}${dealerValue.isBlackjack ? " blackjack" : ""}`}>
              {totalText(dealerValue)}
            </span>
          )}
        </div>
        <div className="bj-hand-cards">
          {dealerHand.map((card, index) => (
            <CardFace
              key={card.id}
              card={card}
              flipping
              hidden={index === 1 && Boolean(seat?.holeHidden)}
              label={index === 1 && seat?.holeHidden ? t.blackjack.holeCardLabel : t.blackjack.dealerLabel}
            />
          ))}
        </div>
      </div>

      <div className="bj-hand-row">
        <div className="bj-hand-heading player">
          <span className="who">{t.common.you}</span>
          {myHand.length > 0 && (
            <span className={`bj-hand-total${myValue.isBust ? " bust" : ""}${myValue.isBlackjack ? " blackjack" : ""}`}>
              {totalText(myValue)}
            </span>
          )}
        </div>
        <div className="bj-hand-cards">
          {myHand.map((card) => (
            <CardFace key={card.id} card={card} flipping label={t.common.you} />
          ))}
        </div>
      </div>

      <div className="btn-row bj-actions">
        <button className="btn primary" disabled={hitDisabled} onClick={hit}>{t.blackjack.hitButton}</button>
        <button className="btn" disabled={busy} onClick={stand}>{t.blackjack.standButton}</button>
      </div>
      <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
    </section>
  );
}
