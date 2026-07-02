"use client";

/**
 * Signal Breaker — UI component. Asymmetric Mastermind: you crack the AI's
 * code on the left while the AI cracks yours on the right (blueprint §11).
 * Symbols carry a shape + letter as well as colour (blueprint §11.4).
 */

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/context/LocaleContext";
import type { GuessRow, SignalDifficulty } from "./types";
import { useSignalBreaker } from "./useSignalBreaker";

const SYMBOLS = [
  { glyph: "●", letter: "A", cls: "s0" },
  { glyph: "■", letter: "B", cls: "s1" },
  { glyph: "▲", letter: "C", cls: "s2" },
  { glyph: "◆", letter: "D", cls: "s3" },
  { glyph: "★", letter: "E", cls: "s4" },
  { glyph: "⬢", letter: "F", cls: "s5" },
];

function Peg({ symbol }: { symbol: number | null }) {
  if (symbol === null) return <span className="sig-peg empty" aria-hidden="true" />;
  const s = SYMBOLS[symbol];
  return (
    <span className={`sig-peg ${s.cls}`} aria-label={s.letter}>
      {s.glyph}
    </span>
  );
}

function Row({ row, hidden }: { row: GuessRow; hidden?: boolean }) {
  return (
    <div className="sig-row">
      <div className="sig-pegs">
        {row.guess.map((sym, i) => (
          <Peg key={i} symbol={hidden ? null : sym} />
        ))}
      </div>
      <div className="sig-feedback">
        {Array.from({ length: row.feedback.exact }).map((_, i) => (
          <span key={`e${i}`} className="sig-clue exact" />
        ))}
        {Array.from({ length: row.feedback.partial }).map((_, i) => (
          <span key={`p${i}`} className="sig-clue partial" />
        ))}
      </div>
    </div>
  );
}

export function SignalBreakerGame() {
  const game = useSignalBreaker();
  const { t } = useLocale();
  const [difficulty, setDifficulty] = useState<SignalDifficulty>("medium");

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  /* ================= SETUP ================= */
  if (game.phase === "setup") {
    return (
      <section className="card screen signal-screen">
        <BackLink />
        <HowToPlay title={t.gamesMeta["signal-breaker"].name}>{t.signalBreaker.rules}</HowToPlay>

        <span className="field-label">
          {t.common.aiDifficulty}{" "}
          <InfoTip label={t.signalBreaker.difficultyTipLabel}>
            {t.signalBreaker.difficultyTip}
          </InfoTip>
        </span>
        <SegPicker
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(v) => {
            setDifficulty(v as SignalDifficulty);
            game.setDifficulty(v as SignalDifficulty);
          }}
        />

        <Toggle
          checked={game.allowRepeats}
          onChange={game.setAllowRepeats}
          label={t.signalBreaker.allowRepeats}
        />

        <div className="btn-row" style={{ marginTop: 22 }}>
          <button className="btn primary" style={{ minWidth: 180 }} onClick={game.startMatch}>
            {t.common.startMatch}
          </button>
        </div>
      </section>
    );
  }

  /* ================= END ================= */
  if (game.phase === "end") {
    const won = game.outcome === "player";
    return (
      <section className="card end-card screen signal-screen">
        <div className="end-emoji">{won ? "🔓" : game.outcome === "tie" ? "🤝" : "🔒"}</div>
        <div className={`end-title ${won ? "player-win" : game.outcome === "ai" ? "ai-win" : ""}`}>
          {t.signalBreaker.endTitle(game.outcome ?? "tie")}
        </div>
        <div className="end-stats">
          <div className="stat-box player">
            <div className="label">{t.signalBreaker.yourGuesses}</div>
            <div className="value">{game.playerSolved ?? "—"}</div>
          </div>
          <div className="stat-box ai">
            <div className="label">{t.signalBreaker.aiGuesses}</div>
            <div className="value">{game.aiSolved ?? "—"}</div>
          </div>
        </div>
        <div className="sig-reveal">
          {t.signalBreaker.codeWas}
          <span className="sig-pegs inline">
            {game.aiSecret.map((sym, i) => (
              <Peg key={i} symbol={sym} />
            ))}
          </span>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={game.playAgain}>
            {t.common.playAgain}
          </button>
          <button className="btn" onClick={game.toSetup}>
            {t.common.changeSettings}
          </button>
          <Link href="/" className="btn">
            {t.common.returnToHub}
          </Link>
        </div>
      </section>
    );
  }

  /* ================= PLAYING ================= */
  const draftComplete = game.draft.every((d) => d !== null);
  const playerLocked = game.playerSolved !== null || game.playerRows.length >= game.maxGuesses;

  return (
    <section className="card screen signal-screen">
      <BackLink />

      <div className="sig-boards">
        <div className="sig-board">
          <h3 className="sig-board-title you">{t.signalBreaker.yourAttack}</h3>
          <p className="sig-progress">
            {t.signalBreaker.guessCount(game.playerRows.length, game.maxGuesses)}
          </p>
          <div className="sig-rows">
            {game.playerRows.map((row, i) => (
              <Row key={i} row={row} />
            ))}
          </div>
        </div>

        <div className="sig-board">
          <h3 className="sig-board-title them">{t.signalBreaker.aiAttack}</h3>
          <p className="sig-progress">
            {t.signalBreaker.guessCount(game.aiRows.length, game.maxGuesses)}
          </p>
          <div className="sig-rows">
            {game.aiRows.map((row, i) => (
              <Row key={i} row={row} hidden />
            ))}
          </div>
        </div>
      </div>

      {!playerLocked ? (
        <div className="sig-input">
          <div className="sig-draft">
            {game.draft.map((sym, i) => (
              <button
                key={i}
                className="sig-slot"
                onClick={() => game.cycleSlot(i)}
                aria-label={t.signalBreaker.slotLabel(i + 1)}
              >
                <Peg symbol={sym} />
              </button>
            ))}
          </div>
          <div className="sig-palette">
            {SYMBOLS.map((s, i) => (
              <button
                key={i}
                className={`sig-peg ${s.cls} pick`}
                onClick={() => {
                  const empty = game.draft.findIndex((d) => d === null);
                  game.setDraftSlot(empty === -1 ? game.draft.length - 1 : empty, i);
                }}
                aria-label={s.letter}
              >
                {s.glyph}
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn primary" disabled={!draftComplete} onClick={game.submitGuess}>
              {t.signalBreaker.submit}
            </button>
            <button className="btn" onClick={game.clearDraft}>
              {t.signalBreaker.clear}
            </button>
          </div>
        </div>
      ) : (
        <p className="sig-waiting">{t.signalBreaker.waitingForAi}</p>
      )}

      <p className="sig-legend">{t.signalBreaker.legend}</p>
    </section>
  );
}
