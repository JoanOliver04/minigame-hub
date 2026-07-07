"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { playSound } from "@/lib/sound";
import {
  BASKET_ROUNDS,
  ROUND_POINTS,
  meterSpeed,
  resolvePlayerShot,
} from "./logic";
import type { BasketRound, BasketShot } from "./types";
import { useBasketRoom } from "./useBasketRoom";

type LocalStage = "player" | "flight" | "result" | "submitted";

export function BasketRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, submit, playAgain, leave } = useBasketRoom(code);
  const [localStage, setLocalStage] = useState<LocalStage>("player");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [meter, setMeter] = useState(8);
  const [lastShot, setLastShot] = useState<BasketShot | null>(null);
  const [history, setHistory] = useState<BasketRound[]>([]);
  const meterRef = useRef(8);
  const directionRef = useRef(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.length = 0;
  };
  const schedule = (fn: () => void, delay: number) => {
    timersRef.current.push(setTimeout(fn, delay));
  };

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage !== "playing" || localStage !== "player") return;
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const elapsed = Math.min(40, now - previous) / 1000;
      previous = now;
      let next = meterRef.current + directionRef.current * meterSpeed("medium") * elapsed;
      if (next >= 100) {
        next = 100;
        directionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        directionRef.current = 1;
      }
      meterRef.current = next;
      setMeter(next);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [localStage, stage]);

  useEffect(() => {
    if (stage !== "playing" || !uid || !room || localStage !== "submitted") return;
    if (!room.game.results[uid]) submit({ score, history });
  }, [history, localStage, room, score, stage, submit, uid]);

  useEffect(() => {
    if (stage !== "playing") return;
    const timer = setTimeout(() => {
      clearTimers();
      setLocalStage("player");
      setRoundIndex(0);
      setScore(0);
      setMeter(8);
      setLastShot(null);
      setHistory([]);
      meterRef.current = 8;
      directionRef.current = 1;
    }, 0);
    return () => clearTimeout(timer);
  }, [stage, room?.game.finished]);

  function shoot() {
    if (stage !== "playing" || localStage !== "player") return;
    const points = ROUND_POINTS[roundIndex];
    const shot = resolvePlayerShot(meterRef.current, roundIndex + 1, points);
    setLastShot(shot);
    setLocalStage("flight");
    playSound("blip");
    schedule(() => {
      setLocalStage("result");
      playSound(shot.made ? "win" : "lose");
      schedule(() => {
        const nextScore = score + shot.scoredPoints;
        const nextHistory = [
          ...history,
          { round: roundIndex + 1, points, player: shot, ai: shot },
        ];
        setScore(nextScore);
        setHistory(nextHistory);
        if (roundIndex + 1 === BASKET_ROUNDS) {
          setLocalStage("submitted");
        } else {
          setRoundIndex((current) => current + 1);
          setLastShot(null);
          meterRef.current = 8;
          directionRef.current = 1;
          setMeter(8);
          setLocalStage("player");
        }
      }, 950);
    }, 720);
  }

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

  const myResult = room.game.results[uid];
  const opponentResult = room.game.results[opponentUid];
  if (stage === "finished") {
    const tie = room.game.winnerUid === null;
    const iWon = room.game.winnerUid === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen">
        <div className="end-emoji">{tie ? "🤝" : iWon ? "🏆" : "🏀"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myResult?.score ?? score, opponentResult?.score ?? 0)}</div>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain} disabled={voted}>
            {voted ? t.rooms.rematchWaiting : t.rooms.rematchButton}
          </button>
          <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
        </div>
      </section>
    );
  }

  if (localStage === "submitted" || myResult) {
    return (
      <section className="card screen">
        <div className="end-number">{t.basketShot.tallyYou(myResult?.score ?? score)}</div>
        <div className="feedback">
          {opponentResult ? t.rooms.submittedWaiting : t.rooms.submittedWaiting}
        </div>
        <p>{opponentName}: {opponentResult ? t.basketShot.tallyAi(opponentResult.score) : "…"}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const points = ROUND_POINTS[roundIndex];
  const isFlight = localStage === "flight";
  let feedback = t.basketShot.releasePrompt;
  let feedbackClass = "";
  if (localStage === "flight") feedback = t.basketShot.yourShot;
  if (localStage === "result" && lastShot) {
    feedback =
      lastShot.releaseZone === "yellow"
        ? t.basketShot.yellowShot
        : lastShot.made
          ? t.basketShot.madeShot(lastShot.scoredPoints)
          : t.basketShot.missedShot;
    feedbackClass = lastShot.made ? " win pop" : " lose pop";
  }

  return (
    <section className="card screen basket-screen">
      <div className="rps-tally">
        <span className="you">{t.basketShot.tallyYou(score)}</span>
        <span className="goal">{t.basketShot.roundLabel(roundIndex + 1, BASKET_ROUNDS, points)}</span>
        <span className="them">{opponentName}</span>
      </div>
      <div className={`feedback${feedbackClass}`}>{feedback}</div>
      <div className="basket-court" aria-label={t.basketShot.courtLabel}>
        <div className="basket-backboard" aria-hidden="true"><span /></div>
        <div className="basket-rim" aria-hidden="true" />
        <div className="basket-net" aria-hidden="true" />
        {lastShot ? (
          <span
            key={`${lastShot.actor}-${lastShot.round}`}
            className={`basket-ball ${isFlight ? "flying" : "landed"} ${lastShot.made ? "made" : "miss"} player`}
            aria-hidden="true"
          >
            🏀
          </span>
        ) : (
          <span className="basket-ball ready" aria-hidden="true">🏀</span>
        )}
        <span className="basket-value-badge">{t.basketShot.pointValue(points)}</span>
      </div>
      <div className={`basket-meter${localStage === "player" ? " active" : ""}`} aria-label={t.basketShot.meterLabel}>
        <div className="basket-meter-zones" />
        <span className="basket-meter-marker" style={{ left: `${meter}%` }} />
      </div>
      <div className="basket-meter-caption">
        <span>{t.basketShot.early}</span>
        <strong>{t.basketShot.perfect}</strong>
        <span>{t.basketShot.late}</span>
      </div>
      <div className="btn-row">
        <button className="btn primary basket-shoot" disabled={localStage !== "player"} onClick={shoot}>
          {t.basketShot.shoot}
        </button>
        <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
      </div>
    </section>
  );
}
