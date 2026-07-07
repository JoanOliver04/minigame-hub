"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { GooseBoard } from "./GooseBoard";
import type { GooseDifficulty, GooseSpecial } from "./types";
import { useGooseGame } from "./useGooseGame";

const PLAYER = "player";
const AI = "ai";
const DIE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function GooseGame() {
  const { t } = useLocale();
  const { phase, game, start, roll, reroll, move, playAgain, toSetup } = useGooseGame();
  const [difficulty, setDifficulty] = useState<GooseDifficulty>("medium");

  if (phase === "setup") {
    return (
      <section className="card screen goose-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["goose-game"].name}>{t.gooseGame.rules}</HowToPlay>
        <div className="goose-emblem" aria-hidden="true"><span>🪿</span><b>63</b><i>🪶</i></div>
        <h1>{t.gamesMeta["goose-game"].name}</h1>
        <p className="goose-tagline">{t.gooseGame.tagline}</p>
        <span className="field-label">{t.common.aiDifficulty}</span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as GooseDifficulty)}
        />
        <p className="goose-note">{t.gooseGame.difficultyDescription[difficulty]}</p>
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" onClick={() => start({ difficulty })}>
            {t.common.startMatch}
          </button>
          <Link href="/rooms" className="btn">{t.gooseGame.playFriend}</Link>
        </div>
      </section>
    );
  }
  if (!game) return null;

  if (phase === "end") {
    const won = game.winner === PLAYER;
    return (
      <section className="card end-card screen goose-screen">
        <div className="end-emoji">{won ? "🏆" : "🪿"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.gooseGame.goalReached}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const myTurn = game.turn === PLAYER;
  const canRoll = myTurn && game.die === null;
  const canMove = myTurn && game.die !== null;
  const canReroll = canMove && !game.rerolled && game.feathers[PLAYER] > 0;
  const action = game.lastAction;
  const actor = action?.actor === PLAYER ? t.common.you : t.common.ai;
  let feedback = myTurn
    ? game.die === null
      ? t.gooseGame.yourRoll
      : t.gooseGame.chooseRoll(game.die)
    : t.gooseGame.aiTurn;
  if (action?.kind === "reroll") feedback = t.gooseGame.rerolled(actor, action.roll);
  if (action?.kind === "move" && action.special) {
    feedback = t.gooseGame.specialFeedback[action.special](actor, action.to ?? 0);
  } else if (action?.kind === "move") {
    feedback = t.gooseGame.moved(actor, action.to ?? 0);
  }
  if (action?.swappedWith) feedback += ` ${t.gooseGame.swapped(actor)}`;
  if (action?.skipped?.length) feedback += ` ${t.gooseGame.skippedTurns(action.skipped.length)}`;

  const specialLabel = (special?: GooseSpecial) =>
    special ? t.gooseGame.specialNames[special] : undefined;

  return (
    <section className="card screen goose-screen">
      <div className="goose-score">
        <div className="player">
          <strong>{t.common.you}</strong>
          <span>{t.gooseGame.squareStatus(game.positions[PLAYER])}</span>
          <small>{t.gooseGame.feathers(game.feathers[PLAYER])}</small>
        </div>
        <div className="rival">
          <strong>{t.common.ai}</strong>
          <span>{t.gooseGame.squareStatus(game.positions[AI])}</span>
          <small>{t.gooseGame.feathers(game.feathers[AI])}</small>
        </div>
      </div>
      <div className="feedback goose-feedback">{feedback}</div>
      <GooseBoard
        state={game}
        viewer={PLAYER}
        boardLabel={t.gooseGame.boardLabel}
        squareLabel={(square, special) => t.gooseGame.squareLabel(square, specialLabel(special))}
        tokenLabel={(actorId, square) =>
          t.gooseGame.tokenLabel(actorId === PLAYER ? t.common.you : t.common.ai, square)}
      />
      <div className="goose-controls">
        <div className={`goose-die${game.die ? " rolled" : ""}`} aria-label={game.die ? t.gooseGame.dieResult(game.die) : t.gooseGame.dieReady}>
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
    </section>
  );
}
