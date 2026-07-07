"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { ColorPicker, PrismCardFace } from "./PrismCardFace";
import { legalCardIndexes, PRISM_COLORS } from "./logic";
import type { PrismColor, PrismDifficulty } from "./types";
import { usePrismClash } from "./usePrismClash";

const PLAYER = "player";
const AI = "ai";

export function PrismClashGame() {
  const { t } = useLocale();
  const {
    phase,
    game,
    pendingPrism,
    startMatch,
    selectCard,
    chooseColor,
    draw,
    playAgain,
    toSetup,
  } = usePrismClash();
  const [difficulty, setDifficulty] = useState<PrismDifficulty>("medium");
  const [target, setTarget] = useState(2);

  if (phase === "setup") {
    return (
      <section className="card screen prism-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["prism-clash"].name}>{t.prismClash.rules}</HowToPlay>
        <div className="prism-hero" aria-hidden="true">
          <span className="ember">✦</span><span className="tide">7</span>
          <span className="bloom">❄</span><span className="volt">+2</span>
        </div>
        <h1>{t.gamesMeta["prism-clash"].name}</h1>
        <p className="prism-tagline">{t.prismClash.tagline}</p>
        <span className="field-label">{t.common.aiDifficulty}</span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as PrismDifficulty)}
        />
        <p className="prism-difficulty-note">{t.prismClash.difficultyDescription[difficulty]}</p>
        <span className="field-label">{t.prismClash.matchLengthLabel}</span>
        <SegPicker
          options={[
            { value: "1", label: t.prismClash.singleWin },
            { value: "2", label: t.prismClash.bestOfThree },
          ]}
          value={String(target)}
          onChange={(value) => setTarget(Number(value))}
        />
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            onClick={() => startMatch({ difficulty, target })}
          >
            {t.common.startMatch}
          </button>
          <Link href="/rooms" className="btn">{t.prismClash.playFriend}</Link>
        </div>
      </section>
    );
  }

  if (!game) return null;

  if (phase === "end") {
    const won = game.winner === PLAYER;
    return (
      <section className="card end-card screen prism-screen">
        <div className="end-emoji">{won ? "🏆" : "🤖"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.common.finalScore(game.scores[PLAYER], game.scores[AI])}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const legal = legalCardIndexes(game, PLAYER);
  const myTurn = game.turn === PLAYER;
  const top = game.discardPile[game.discardPile.length - 1];
  const action = game.lastAction;
  const actorName = action?.actor === PLAYER ? t.common.you : t.common.ai;
  let feedback = myTurn ? t.prismClash.yourTurn : t.prismClash.aiTurn;
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

  const cardLabel = (card: (typeof game.hands)[string][number]) =>
    t.prismClash.cardLabel(
      card.kind,
      card.color ? t.prismClash.colors[card.color] : "",
      card.value,
    );

  return (
    <section className="card screen prism-screen">
      <div className="rps-tally">
        <span className="you">{t.prismClash.scoreYou(game.scores[PLAYER])}</span>
        <span className="goal">{t.prismClash.firstTo(game.target)}</span>
        <span className="them">{t.prismClash.scoreAi(game.scores[AI])}</span>
      </div>

      <div className="prism-opponent">
        <div className="prism-player-line">
          <strong>{t.common.ai}</strong>
          <span>{t.prismClash.cardsCount(game.hands[AI].length)}</span>
        </div>
        <div className="prism-back-fan" aria-label={t.prismClash.opponentHand}>
          {game.hands[AI].slice(0, 10).map((card) => (
            <PrismCardFace key={card.id} label={t.prismClash.hiddenCard} />
          ))}
          {game.hands[AI].length > 10 && <b>+{game.hands[AI].length - 10}</b>}
        </div>
      </div>

      <div className="feedback prism-feedback">{feedback}</div>

      <div className="prism-table">
        <button
          type="button"
          className="prism-deck"
          disabled={!myTurn || legal.length > 0 || pendingPrism !== null}
          onClick={draw}
          aria-label={t.prismClash.drawCard}
        >
          <PrismCardFace label={t.prismClash.drawPile} />
          <span>{game.drawPile.length}</span>
        </button>
        <div className="prism-discard">
          <PrismCardFace card={top} label={cardLabel(top)} />
        </div>
        <div className={`prism-active ${game.activeColor}`}>
          <span /> {t.prismClash.activeColor(t.prismClash.colors[game.activeColor])}
        </div>
      </div>

      {pendingPrism !== null && (
        <ColorPicker
          colors={PRISM_COLORS}
          label={t.prismClash.chooseColor}
          colorLabel={(color: PrismColor) => t.prismClash.colors[color]}
          onPick={chooseColor}
        />
      )}

      <div className="prism-player-line">
        <strong>{t.common.you}</strong>
        <span>{t.prismClash.cardsCount(game.hands[PLAYER].length)}</span>
      </div>
      <div className="prism-hand" aria-label={t.prismClash.yourHand}>
        {game.hands[PLAYER].map((card, index) => (
          <PrismCardFace
            key={card.id}
            card={card}
            label={cardLabel(card)}
            selected={pendingPrism === index}
            disabled={!myTurn || !legal.includes(index) || pendingPrism !== null}
            onClick={() => selectCard(index)}
          />
        ))}
      </div>
      <p className="prism-hint">
        {myTurn
          ? legal.length > 0
            ? t.prismClash.playHint
            : t.prismClash.drawHint
          : t.prismClash.waitHint}
      </p>
    </section>
  );
}
