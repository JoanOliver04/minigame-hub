"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { legalParchisMoves } from "./logic";
import { ParchisBoard } from "./ParchisBoard";
import type { ParchisDifficulty } from "./types";
import { useParchis } from "./useParchis";

const PLAYER = "player";
const AI = "ai";

function Dice({ value }: { value: number | null }) {
  const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return <div className={`parchis-die${value ? " rolled" : ""}`} aria-hidden="true">{value ? faces[value] : "?"}</div>;
}

export function ParchisGame() {
  const { t } = useLocale();
  const { phase, game, start, roll, move, playAgain, toSetup } = useParchis();
  const [difficulty, setDifficulty] = useState<ParchisDifficulty>("medium");
  const [pieceCount, setPieceCount] = useState<"2" | "4">("2");

  if (phase === "setup") {
    return (
      <section className="card screen parchis-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta.parchis.name}>{t.parchis.rules}</HowToPlay>
        <div className="parchis-emblem" aria-hidden="true">
          <span className="red">●</span><b>⚄</b><span className="blue">●</span>
        </div>
        <h1>{t.gamesMeta.parchis.name}</h1>
        <p className="parchis-tagline">{t.parchis.tagline}</p>
        <span className="field-label">{t.common.aiDifficulty}</span>
        <SegPicker
          options={[
            { value: "easy", label: t.common.easy },
            { value: "medium", label: t.common.medium },
            { value: "hard", label: t.common.hard },
          ]}
          value={difficulty}
          onChange={(value) => setDifficulty(value as ParchisDifficulty)}
        />
        <p className="parchis-note">{t.parchis.difficultyDescription[difficulty]}</p>
        <span className="field-label">{t.parchis.gameLength}</span>
        <SegPicker
          options={[
            { value: "2", label: t.parchis.quickGame },
            { value: "4", label: t.parchis.classicGame },
          ]}
          value={pieceCount}
          onChange={(value) => setPieceCount(value as "2" | "4")}
        />
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn primary"
            onClick={() => start({ difficulty, pieceCount: Number(pieceCount) as 2 | 4 })}
          >
            {t.common.startMatch}
          </button>
          <Link href="/rooms" className="btn">{t.parchis.playFriend}</Link>
        </div>
      </section>
    );
  }
  if (!game) return null;

  if (phase === "end") {
    const won = game.winner === PLAYER;
    return (
      <section className="card end-card screen parchis-screen">
        <div className="end-emoji">{won ? "🏆" : "🤖"}</div>
        <div className={`end-title ${won ? "player-win" : "ai-win"}`}>
          {won ? t.common.youWinMatch : t.common.aiWinsMatch}
        </div>
        <div className="end-number">{t.parchis.finishedCount(game.pieceCount)}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>{t.common.playAgain}</button>
          <button className="btn" onClick={toSetup}>{t.common.changeSettings}</button>
          <Link href="/" className="btn">{t.common.returnToHub}</Link>
        </div>
      </section>
    );
  }

  const legal = legalParchisMoves(game, PLAYER);
  const myTurn = game.turn === PLAYER;
  const canRoll = myTurn && game.pendingSteps === null;
  const action = game.lastAction;
  const actor = action?.actor === PLAYER ? t.common.you : t.common.ai;
  let feedback = myTurn ? (canRoll ? t.parchis.yourRoll : t.parchis.choosePiece) : t.parchis.aiTurn;
  if (game.pendingSource === "capture") feedback = t.parchis.chooseBonus(20);
  if (game.pendingSource === "goal") feedback = t.parchis.chooseBonus(10);
  if (action?.kind === "capture") feedback = t.parchis.captured(actor);
  if (action?.kind === "goal") feedback = t.parchis.reachedGoal(actor);
  if (action?.kind === "tripleSix") feedback = t.parchis.tripleSix(actor);
  if (action?.kind === "blocked") feedback = t.parchis.noMove(actor);

  const homeCount = (actorId: string) =>
    game.pieces[actorId].filter((piece) => piece.progress === -1).length;
  const goalCount = (actorId: string) =>
    game.pieces[actorId].filter((piece) => piece.progress === 75).length;

  return (
    <section className="card screen parchis-screen">
      <div className="parchis-score">
        <div className="red"><strong>{t.common.you}</strong><span>{t.parchis.pieceStatus(homeCount(PLAYER), goalCount(PLAYER))}</span></div>
        <div className="blue"><strong>{t.common.ai}</strong><span>{t.parchis.pieceStatus(homeCount(AI), goalCount(AI))}</span></div>
      </div>
      <div className="feedback parchis-feedback">{feedback}</div>
      <ParchisBoard
        state={game}
        viewer={PLAYER}
        legal={legal}
        boardLabel={t.parchis.boardLabel}
        pieceLabel={(mine, piece, status) =>
          t.parchis.pieceLabel(
            mine ? t.common.you : t.common.ai,
            piece,
            t.parchis.pieceStatuses[status],
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
              : myTurn
                ? t.parchis.rollPrompt
                : t.parchis.waitPrompt}
          </small>
        </div>
      </div>
      <div className="parchis-legend">
        <span><i className="safe" />{t.parchis.safeLegend}</span>
        <span><i className="bridge" />{t.parchis.bridgeLegend}</span>
      </div>
    </section>
  );
}
