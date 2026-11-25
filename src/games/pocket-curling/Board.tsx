import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { isMotionReduced } from "@/lib/motion";
import type { BoardProps } from "../duels/types";
import { HOUSE, START, endScore, slide, type CurlingState, type Shot, type Stone } from "./logic";

function Stones({ state }: { state: CurlingState }) {
  const [frame, setFrame] = useState<Stone[] | null>(null);
  useEffect(() => {
    if (!state.last || isMotionReduced()) return;
    const frames: Stone[][] = [];
    const { before, seat, shot } = state.last;
    slide(before, seat, shot, state.moves, frames);
    const start = performance.now();
    let request: number;
    function draw(time: number) {
      const index = Math.floor((time - start) / 13);
      if (index >= frames.length) { setFrame(null); return; }
      setFrame(frames[index]);
      request = requestAnimationFrame(draw);
    }
    request = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(request);
  }, [state.last, state.moves]);
  return (frame ?? state.stones).map(s => <span key={s.id} className="curl-stone" data-seat={s.seat}
    style={{ left: `${s.x / 1.5}%`, top: `${s.y}%` }} aria-hidden="true">{s.seat === 0 ? "A" : "B"}</span>);
}

export function CurlingBoard({ state, names, onPlay }: BoardProps<CurlingState, Shot>) {
  const { locale } = useLocale();
  const es = locale === "es";
  const [angle, setAngle] = useState(0), [power, setPower] = useState(60), [spin, setSpin] = useState(0);
  const guide = useMemo(() => {
    const frames: Stone[][] = [];
    slide([], 0, { angle, power, spin }, 0, frames);
    return frames.filter((frame, i) => frame.length && (i % 2 === 0 || i === frames.length - 1)).map(frame => frame[0]);
  }, [angle, power, spin]);
  const round = Math.min(3, state.ends.length + 1);
  const points = endScore(state.stones);
  const totals = [state.ends.reduce((s,n) => s + Math.max(0,n), 0), state.ends.reduce((s,n) => s + Math.max(0,-n), 0)];
  return <>
    <div className="duel-scores">{names.map((name, i) => <div key={i}><span>{i === 0 ? "A" : "B"} · {name}</span><strong>{totals[i]}</strong></div>)}</div>
    <p className="curl-round">{es ? "Manga" : "End"} {round}/3 · {es ? "Piedra" : "Stone"} {Math.min(state.moves, 11) % 4 + 1}/4</p>
    <div className="curl-rink" role="img" aria-label={[es ? "Pista de curling" : "Curling sheet", ...state.stones.map(s =>
      `${names[s.seat]} · ${Math.round(Math.hypot(s.x - HOUSE.x, s.y - HOUSE.y))} ${es ? "del centro" : "from centre"}`)].join(". ")}>
      <span className="curl-house" style={{ left: `${HOUSE.x / 1.5}%`, top: `${HOUSE.y}%`, width: `${2 * HOUSE.radius / 1.5}%` }} />
      {onPlay && <span aria-hidden="true" className="curl-guide">{guide.map((p, i) =>
        <i key={i} style={{ left: `${p.x / 1.5}%`, top: `${p.y}%` }} />)}</span>}
      {onPlay && <span className="curl-stone" aria-hidden="true" data-seat={state.active}
        style={{ left: `${START.x / 1.5}%`, top: `${START.y}%` }}>{state.active === 0 ? "A" : "B"}</span>}
      <Stones key={state.moves} state={state} />
    </div>
    <p className="duel-note" role="status">{points ? (es ? "Puntúa" : "Scoring") + " · " + names[points > 0 ? 0 : 1] + " +" + Math.abs(points)
      : es ? "Sin ventaja en la diana" : "Neither side leads in the house"}</p>
    {state.ends.length > 0 && <p className="curl-results">{state.ends.map((n, i) => <span key={i}>
      {es ? "Manga" : "End"} {i + 1} · {n ? `${n > 0 ? "A" : "B"} +${Math.abs(n)}` : "0–0"}
    </span>)}</p>}
    {state.winner === null && <fieldset className="curl-controls" disabled={!onPlay}>
      <legend>{es ? "Prepara tu lanzamiento" : "Set your delivery"}</legend>
      <label>{es ? "Ángulo" : "Angle"} <b>{angle}°</b><input type="range" min="-25" max="25" value={angle} onChange={e => setAngle(Number(e.target.value))} /></label>
      <label>{es ? "Potencia" : "Power"} <b>{power}%</b><input type="range" min="30" max="100" value={power} onChange={e => setPower(Number(e.target.value))} /></label>
      <label>{es ? "Efecto" : "Curl"} <select value={spin} onChange={e => setSpin(Number(e.target.value))}>
        <option value={-1}>{es ? "Hacia arriba" : "Bend up"}</option><option value={0}>{es ? "Recto" : "Straight"}</option>
        <option value={1}>{es ? "Hacia abajo" : "Bend down"}</option>
      </select></label>
      <button className="btn primary curl-throw" type="button" onClick={() => onPlay?.({ angle, power, spin })}>{es ? "Lanzar piedra" : "Deliver stone"}</button>
    </fieldset>}
  </>;
}
