"use client";

/**
 * Number Duel — UI component. Three phases: setup, playing, end.
 * Rules and AI live in ./logic and ./ai; the engine in ./useGuessGame.
 * Behavior is a faithful port of the original vanilla app.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { HowToPlay } from "@/components/ui/HowToPlay";
import { InfoTip } from "@/components/ui/InfoTip";
import { SegPicker } from "@/components/ui/SegPicker";
import { Toggle } from "@/components/ui/Toggle";
import { useLocale } from "@/context/LocaleContext";
import { EMPTY_SCORES, useScores } from "@/context/ScoresContext";
import { getUseDelay, setUseDelay } from "@/lib/settings";
import { isSoundEnabled, playSound, setSoundEnabled } from "@/lib/sound";
import type { Difficulty } from "./logic";
import { useGuessGame } from "./useGuessGame";

export function GuessGame() {
  const { phase, round, start, submitPlayerGuess, playAgain, toSetup } = useGuessGame();
  const { scores } = useScores();
  const { t } = useLocale();
  const tally = scores.guess ?? EMPTY_SCORES;

  const RANGE_OPTIONS = [
    { value: "1,50", label: t.guess.rangeOptions.r50 },
    { value: "1,100", label: t.guess.rangeOptions.r100 },
    { value: "1,500", label: t.guess.rangeOptions.r500 },
    { value: "custom", label: t.guess.rangeOptions.custom },
  ];

  const DIFFICULTY_OPTIONS = [
    { value: "easy", label: t.common.easy },
    { value: "medium", label: t.common.medium },
    { value: "hard", label: t.common.hard },
  ];

  // --- setup screen state ---
  const [rangeChoice, setRangeChoice] = useState("1,100");
  const [customMin, setCustomMin] = useState("1");
  const [customMax, setCustomMax] = useState("1000");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [delayOn, setDelayOn] = useState(getUseDelay());
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [startError, setStartError] = useState("");

  // --- play screen state ---
  const [guessValue, setGuessValue] = useState("");
  const [guessError, setGuessError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Refocus the guess input whenever the turn comes back to the player.
  useEffect(() => {
    if (phase === "playing" && round?.playing && round.turn === "player") {
      inputRef.current?.focus();
    }
  }, [phase, round?.playing, round?.turn]);

  /** Validate range settings and start a round. */
  function handleStart() {
    let min: number;
    let max: number;

    if (rangeChoice !== "custom") {
      const parts = rangeChoice.split(",").map(Number);
      min = parts[0];
      max = parts[1];
    } else {
      const lo = parseInt(customMin, 10);
      const hi = parseInt(customMax, 10);
      if (Number.isNaN(lo) || Number.isNaN(hi)) {
        setStartError(t.guess.errorMinMax);
        return;
      }
      if (hi <= lo) {
        setStartError(t.guess.errorMaxGtMin);
        return;
      }
      if (hi - lo > 1000000) {
        setStartError(t.guess.errorRangeHuge);
        return;
      }
      min = lo;
      max = hi;
    }

    setStartError("");
    setUseDelay(delayOn);
    setSoundEnabled(soundOn);
    setGuessValue("");
    setGuessError("");
    start({ min, max, difficulty });
  }

  /** Validate and submit the player's guess (Enter key or button). */
  function handleGuessSubmit(e: FormEvent) {
    e.preventDefault();
    if (!round || !round.playing || round.turn !== "player") return;

    const raw = guessValue.trim();
    if (raw === "") {
      setGuessError(t.guess.errorEnterNumber);
      playSound("error");
      return;
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) {
      setGuessError(t.guess.errorWholeNumber);
      playSound("error");
      return;
    }
    if (n < round.config.min || n > round.config.max) {
      setGuessError(t.guess.errorStayBetween(round.config.min, round.config.max));
      playSound("error");
      return;
    }
    setGuessError("");
    setGuessValue("");
    submitPlayerGuess(n);
  }

  /* ---------- in-game mini scoreboard (win/loss chips) ---------- */
  const chips = (
    <div className="scoreboard">
      <div className="score-chip player">
        <span className="dot" /> {t.common.you}{" "}
        <span className="num bump" key={`w${tally.win}`}>
          {tally.win}
        </span>
      </div>
      <div className="score-chip ai">
        <span className="dot" /> {t.common.ai}{" "}
        <span className="num bump" key={`l${tally.loss}`}>
          {tally.loss}
        </span>
      </div>
    </div>
  );

  /* ================= SETUP ================= */
  if (phase === "setup") {
    return (
      <>
        {chips}
        <section className="card screen">
          <BackLink />
          <HowToPlay title={t.gamesMeta.guess.name}>{t.guess.rules}</HowToPlay>

          <span className="field-label">{t.guess.rangeLabel}</span>
          <SegPicker options={RANGE_OPTIONS} value={rangeChoice} onChange={setRangeChoice} />

          {rangeChoice === "custom" && (
            <>
              <span className="field-label">{t.guess.customRangeLabel}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="number"
                  placeholder={t.guess.minPlaceholder}
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                />
                <input
                  type="number"
                  placeholder={t.guess.maxPlaceholder}
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                />
              </div>
            </>
          )}

          <span className="field-label">
            {t.common.aiDifficulty}{" "}
            <InfoTip label={t.guess.difficultyTipLabel}>{t.guess.difficultyTip}</InfoTip>
          </span>
          <SegPicker
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            onChange={(v) => setDifficulty(v as Difficulty)}
          />

          <Toggle label={t.guess.delayToggle} checked={delayOn} onChange={setDelayOn} />
          <Toggle label={t.guess.soundToggle} checked={soundOn} onChange={setSoundOn} />

          <p className="error-msg">{startError}</p>

          <div className="btn-row" style={{ marginTop: 8 }}>
            <button className="btn primary" style={{ minWidth: 180 }} onClick={handleStart}>
              {t.guess.startGame}
            </button>
          </div>
        </section>
      </>
    );
  }

  if (!round) return null;

  /* ================= END ================= */
  if (phase === "end") {
    const playerWon = round.winner === "player";
    return (
      <>
        {chips}
        <section className="card end-card screen">
          <div className="end-emoji">{playerWon ? "🏆" : "🤖"}</div>
          <div className={`end-title ${playerWon ? "player-win" : "ai-win"}`}>
            {playerWon ? t.guess.youWin : t.guess.aiWins}
          </div>
          <div className="end-number">
            {t.guess.secretWas} <strong>{round.secret}</strong>
          </div>
          <div className="end-stats">
            <div className="stat-box player">
              <div className="label">{t.guess.yourGuesses}</div>
              <div className="value">{round.playerGuesses}</div>
            </div>
            <div className="stat-box ai">
              <div className="label">{t.guess.aiGuesses}</div>
              <div className="value">{round.aiGuesses}</div>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn primary" onClick={playAgain}>
              {t.common.playAgain}
            </button>
            <button className="btn" onClick={toSetup}>
              {t.common.changeSettings}
            </button>
            <Link href="/" className="btn">
              {t.common.returnToHub}
            </Link>
          </div>
        </section>
      </>
    );
  }

  /* ================= PLAYING ================= */
  const { config } = round;
  const total = config.max - config.min;
  const leftPct = total === 0 ? 0 : ((round.knownLow - config.min) / total) * 100;
  const widthPct = total === 0 ? 100 : ((round.knownHigh - round.knownLow) / total) * 100;

  const feedback = round.feedback;
  const feedbackName = feedback?.who === "player" ? t.common.you : t.common.ai;
  const feedbackText = feedback ? t.guess.feedback(feedbackName, feedback.guess, feedback.verdict) : "";

  return (
    <>
      {chips}
      <section className="card screen">
        <BackLink />

        <div className={`turn-banner ${round.turn}`}>
          {round.turn === "player" ? (
            t.guess.turnPlayer
          ) : (
            <>
              {t.guess.turnAi}
              <span className="think-dots">
                <span />
                <span />
                <span />
              </span>
            </>
          )}
        </div>

        <div className="range-visual">
          <div className="range-track">
            <div
              className="range-fill"
              style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1.5)}%` }}
            />
          </div>
          <div className="range-labels">
            <span>{config.min}</span>
            <span>{config.max}</span>
          </div>
          <div className="range-caption">
            {t.guess.possibleRange}{" "}
            <strong>
              {round.knownLow} – {round.knownHigh}
            </strong>{" "}
            {t.guess.rangeCaptionSuffix}
          </div>
        </div>

        <form className="guess-form" onSubmit={handleGuessSubmit} noValidate>
          <input
            ref={inputRef}
            type="number"
            placeholder={t.guess.guessPlaceholder}
            autoComplete="off"
            value={guessValue}
            disabled={round.turn !== "player"}
            onChange={(e) => setGuessValue(e.target.value)}
          />
          <button type="submit" className="btn primary" disabled={round.turn !== "player"}>
            {t.guess.guessButton}
          </button>
        </form>
        <p className="error-msg">{guessError}</p>

        {feedback ? (
          <div key={round.log.length} className={`feedback ${feedback.verdict} pop`}>
            {feedbackText}
          </div>
        ) : (
          <div className="feedback" />
        )}

        <div className="log-title">{t.guess.logTitle}</div>
        <ul className="log">
          {round.log.map((entry) => (
            <li key={entry.id} className={entry.who}>
              <span className="who">{entry.who === "player" ? t.common.you : t.common.ai}</span>
              <span className="val">{entry.guess}</span>
              <span className={`verdict ${entry.verdict}`}>
                {entry.verdict === "high"
                  ? t.guess.verdictHigh
                  : entry.verdict === "low"
                    ? t.guess.verdictLow
                    : t.guess.verdictCorrect}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
