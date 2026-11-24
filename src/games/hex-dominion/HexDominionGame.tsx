"use client";

import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { useLocale } from "@/context/LocaleContext";
import { HexBoard } from "./HexBoard";
import type { HexDifficulty } from "./types";
import { useHexDominion } from "./useHexDominion";

export function HexDominionGame() {
  const game = useHexDominion();
  const { t } = useLocale();
  const copy = t.hexDominion;
  if (game.phase === "setup") {
    const options = (["easy", "medium", "hard"] as const).map(value => ({ value, label: t.common[value] }));
    return <section className="card screen hex-screen">
      <BackLink />
      <HowToPlay title={t.gamesMeta["hex-dominion"].name}>{copy.rules}</HowToPlay>
      <span className="field-label">{t.common.aiDifficulty} <InfoTip label={copy.difficultyTipLabel}>{copy.difficultyTip}</InfoTip></span>
      <SegPicker options={options} value={game.difficulty} onChange={v => game.setDifficulty(v as HexDifficulty)} />
      <div className="btn-row"><button className="btn primary" onClick={game.startMatch}>{t.common.startMatch}</button></div>
    </section>;
  }

  const winner = game.state.winner;
  return <section className={`card screen hex-screen${winner ? " end-card" : ""}`}>
    <BackLink />
    {winner ? <>
      <div className={`end-title ${winner === "player" ? "player-win" : "ai-win"}`}>{copy.endTitle(winner)}</div>
      <p>{copy.movesLabel(game.state.moves)} · {t.play.winningPath}</p>
    </> : <div className="hex-status" aria-live="polite">{game.thinking ? copy.aiThinking : copy.yourTurn}</div>}
    <HexBoard board={game.state.board} opponent={copy.aiLegend} winner={winner} onPlay={game.thinking ? undefined : game.play} />
    {winner && <div className="btn-row">
      <button className="btn primary" onClick={game.playAgain}>{t.common.playAgain}</button>
      <button className="btn" onClick={game.toSetup}>{t.common.changeSettings}</button>
      <Link href="/" className="btn">{t.common.returnToHub}</Link>
    </div>}
  </section>;
}
