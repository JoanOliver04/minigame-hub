"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { playSound } from "@/lib/sound";
import { planKeeper } from "./ai";
import { aimSector, estimateShot, resolvePenalty } from "./logic";
import type { PenaltyResult, Point, ShotStyle } from "./types";
import { usePenaltyRoom } from "./usePenaltyRoom";

const TOTAL_KICKS = 5;
const STYLE_ORDER: ShotStyle[] = ["placed", "power", "chip"];

function pointStyle(point: Point): CSSProperties {
  return { left: `${point.x}%`, top: `${point.y}%` };
}

function kickSymbol(kind: PenaltyResult["kind"]) {
  if (kind === "goal") return "✓";
  if (kind === "saved") return "◆";
  if (kind === "post") return "!";
  return "×";
}

export function PenaltyRoomGame({ code }: { code: string }) {
  const { t } = useLocale();
  const { uid, room, stage, submit, playAgain, leave } = usePenaltyRoom(code);
  const [localStage, setLocalStage] = useState<"aiming" | "flying" | "result" | "submitted">("aiming");
  const [aim, setAim] = useState<Point>({ x: 50, y: 43 });
  const [power, setPower] = useState(68);
  const [style, setStyle] = useState<ShotStyle>("placed");
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const [kicks, setKicks] = useState<PenaltyResult[]>([]);
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
    if (stage !== "playing") return;
    const timer = setTimeout(() => {
      clearTimers();
      setLocalStage("aiming");
      setAim({ x: 50, y: 43 });
      setPower(68);
      setStyle("placed");
      setResult(null);
      setKicks([]);
    }, 0);
    return () => clearTimeout(timer);
  }, [stage, room?.game.finished]);

  useEffect(() => {
    if (stage !== "playing" || !uid || !room || localStage !== "submitted") return;
    if (room.game.results[uid]) return;
    submit({ goals: kicks.filter((kick) => kick.kind === "goal").length, kicks });
  }, [kicks, localStage, room, stage, submit, uid]);

  function chooseAim(event: MouseEvent<HTMLButtonElement>) {
    if (localStage !== "aiming" || event.detail === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setAim({
      x: Math.min(95, Math.max(5, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(93, Math.max(7, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  }

  function chooseStyle(nextStyle: ShotStyle) {
    if (localStage !== "aiming") return;
    setStyle(nextStyle);
    setPower(nextStyle === "placed" ? 68 : nextStyle === "power" ? 86 : 56);
  }

  function shoot() {
    if (stage !== "playing" || localStage !== "aiming") return;
    const keeperPlan = planKeeper(aim, "medium", kicks, style, power);
    const kick = resolvePenalty(aim, power, style, keeperPlan);
    const nextKicks = [...kicks, kick];
    setResult(kick);
    setKicks(nextKicks);
    setLocalStage("flying");
    playSound("blip");
    schedule(() => {
      setLocalStage("result");
      playSound(kick.kind === "goal" ? "win" : kick.kind === "post" ? "error" : "lose");
      schedule(() => {
        if (nextKicks.length === TOTAL_KICKS) {
          setLocalStage("submitted");
        } else {
          setResult(null);
          setLocalStage("aiming");
        }
      }, 1350);
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

  const goals = kicks.filter((kick) => kick.kind === "goal").length;
  const myResult = room.game.results[uid];
  const opponentResult = room.game.results[opponentUid];

  if (stage === "finished") {
    const tie = room.game.winnerUid === null;
    const iWon = room.game.winnerUid === uid;
    const voted = Boolean(room.rematchVotes[uid]);
    return (
      <section className="card end-card screen penalty-end">
        <div className="end-emoji">{tie ? "🤝" : iWon ? "🏆" : "🧤"}</div>
        <div className={`end-title ${iWon ? "player-win" : tie ? "" : "ai-win"}`}>
          {tie ? t.rooms.roundResultTie : iWon ? t.rooms.matchWinYou : t.rooms.matchWinOpponent(opponentName ?? "?")}
        </div>
        <div className="end-number">{t.common.finalScore(myResult?.goals ?? goals, opponentResult?.goals ?? 0)}</div>
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
      <section className="card screen penalty-screen">
        <div className="end-number">{t.penaltyKick.goalsCount(myResult?.goals ?? goals)}</div>
        <div className="feedback">{t.rooms.submittedWaiting}</div>
        <p>{opponentName}: {opponentResult ? t.penaltyKick.goalsCount(opponentResult.goals) : "…"}</p>
        <div className="btn-row"><button className="btn" onClick={leave}>{t.rooms.leaveButton}</button></div>
      </section>
    );
  }

  const sector = aimSector(aim);
  const targetName = t.penaltyKick.targetName(sector.horizontal, sector.vertical);
  const estimate = estimateShot(aim, power, style);
  const feedback =
    localStage === "aiming"
      ? t.penaltyKick.aimPrompt(targetName)
      : localStage === "flying"
        ? t.penaltyKick.shooting
        : result
          ? t.penaltyKick.resultName[result.kind]
          : "";
  const keeperPoint = result?.keeper ?? { x: 50, y: 75 };
  const displayedBall = result?.ball ?? { x: 50, y: 128 };
  const powerDelta = power - estimate.idealPower;

  return (
    <section className="card screen penalty-screen">
      <div className="penalty-score">
        <strong>{t.penaltyKick.goalsCount(goals)}</strong>
        <span>{t.penaltyKick.kickCount(localStage === "aiming" ? kicks.length + 1 : kicks.length, TOTAL_KICKS)}</span>
        <strong>{opponentName}</strong>
      </div>
      <div className={`feedback penalty-feedback ${localStage === "result" ? result?.kind === "goal" ? "win pop" : "lose pop" : ""}`}>
        {feedback}
      </div>
      <div className="penalty-stadium">
        <div className="penalty-crowd" aria-hidden="true" />
        <button
          type="button"
          className="penalty-goal"
          onClick={chooseAim}
          disabled={localStage !== "aiming"}
          aria-label={t.penaltyKick.goalLabel(targetName)}
        >
          <span className="penalty-net" aria-hidden="true" />
          <span className="penalty-goal-depth" aria-hidden="true" />
          <span className={`penalty-keeper ${result && localStage !== "aiming" ? "diving" : "ready"}`} style={pointStyle(keeperPoint)} aria-hidden="true">
            <span className="penalty-keeper-head" />
            <span className="penalty-keeper-body" />
            <span className="penalty-keeper-arm left" />
            <span className="penalty-keeper-arm right" />
            <span className="penalty-keeper-leg left" />
            <span className="penalty-keeper-leg right" />
          </span>
          {localStage === "flying" && result && <span className="penalty-trail" style={pointStyle(result.ball)} aria-hidden="true" />}
          <span className={`penalty-ball ${result && localStage !== "aiming" ? "shot" : "ready"} ${result?.kind ?? ""} ${result?.style ?? style}`} style={pointStyle(displayedBall)} aria-hidden="true">
            ⚽
          </span>
          {localStage === "aiming" && <span className="penalty-target" style={pointStyle(aim)} aria-hidden="true"><i /></span>}
        </button>
        <div className="penalty-spot" aria-hidden="true" />
      </div>

      {localStage === "result" && result ? (
        <div className="penalty-result-card">
          <div><span>{t.penaltyKick.shotStyle}</span><strong>{t.penaltyKick.styles[result.style]}</strong></div>
          <div><span>{t.penaltyKick.quality}</span><strong>{result.quality}%</strong></div>
          <div><span>{t.penaltyKick.speed}</span><strong>{result.speed} km/h</strong></div>
          <div><span>{t.penaltyKick.keeperDecision}</span><strong>{t.penaltyKick.keeperStrategies[result.keeperStrategy]}</strong></div>
        </div>
      ) : (
        <div className="penalty-controls">
          <span className="field-label penalty-control-label">{t.penaltyKick.shotStyle}</span>
          <div className="penalty-style-grid">
            {STYLE_ORDER.map((option) => (
              <button
                type="button"
                key={option}
                className={option === style ? "selected" : ""}
                aria-pressed={option === style}
                disabled={localStage !== "aiming"}
                onClick={() => chooseStyle(option)}
              >
                <b>{t.penaltyKick.styles[option]}</b>
                <small>{t.penaltyKick.styleDescriptions[option]}</small>
              </button>
            ))}
          </div>
          <label className="penalty-power">
            <span>{t.penaltyKick.power}<strong>{power}%</strong></span>
            <div className="penalty-range-wrap">
              <span className="penalty-ideal" style={{ left: `${((estimate.idealPower - 35) / 65) * 100}%` }} aria-hidden="true" />
              <input
                type="range"
                min="35"
                max="100"
                value={power}
                disabled={localStage !== "aiming"}
                aria-label={t.penaltyKick.power}
                onChange={(event) => setPower(Number(event.target.value))}
              />
            </div>
            <small className={Math.abs(powerDelta) <= 7 ? "ideal" : ""}>{t.penaltyKick.powerHint(power, estimate.idealPower)}</small>
          </label>
          <div className="btn-row">
            <button className="btn primary penalty-shoot" onClick={shoot} disabled={localStage !== "aiming"}>
              <span aria-hidden="true">⚽</span> {t.penaltyKick.shoot}
            </button>
            <button className="btn" onClick={leave}>{t.rooms.leaveButton}</button>
          </div>
        </div>
      )}

      <div className="penalty-dots" aria-label={t.penaltyKick.kickHistory}>
        {Array.from({ length: TOTAL_KICKS }, (_, index) => {
          const kick = kicks[index];
          return (
            <span key={index} className={kick?.kind ?? (localStage === "aiming" && index === kicks.length ? "current" : "")}>
              {kick ? kickSymbol(kick.kind) : index + 1}
            </span>
          );
        })}
      </div>
    </section>
  );
}
