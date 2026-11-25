import { useLocale } from "@/context/LocaleContext";
import type { BoardProps, Seat } from "../duels/types";
import { jumps, WIDTH, type IceState } from "./logic";

export function IceBoard({ state, names, onPlay }: BoardProps<IceState, number>) {
  const { locale } = useLocale();
  const es = locale === "es";
  const legal = jumps(state, state.active);
  return <>
    <div className="duel-scores ice-legend">{names.map((name, i) => {
      const options = jumps(state, i as Seat).length;
      return <div key={i}><span><b className="ice-number" data-seat={i}>{i + 1}</b> {name}</span>
        <strong>{options} {es ? options === 1 ? "salida" : "salidas" : options === 1 ? "exit" : "exits"}</strong></div>;
    })}</div>
    <div className="ice-board" role="group" aria-label={es ? "Campo de hielo" : "Ice field"}>
      {Array.from({ length: WIDTH * WIDTH }, (_, i) => {
        const seat = state.pawns.indexOf(i);
        const water = Boolean(state.water & (1 << i));
        const target = Boolean(onPlay && legal.includes(i));
        const coord = String.fromCharCode(65 + i % WIDTH) + (1 + Math.floor(i / WIDTH));
        const label = seat >= 0 ? names[seat] : water ? (es ? "Agua" : "Water")
          : target ? (es ? "Saltar" : "Jump") : (es ? "Hielo" : "Ice");
        return <button className="ice-tile" key={i} type="button" data-water={water} data-last={i === state.lastSunk}
          disabled={!target} aria-label={coord + " · " + label} onClick={() => onPlay?.(i)}>
          {seat >= 0 ? <span className="ice-pawn" aria-hidden="true">🐧<b className="ice-number" data-seat={seat}>{seat + 1}</b></span>
            : target ? <span className="ice-target" aria-hidden="true" /> : null}
        </button>;
      })}
    </div>
    <p className="duel-note">{es ? "Salta a una casilla marcada. El hielo que dejas se hunde." : "Jump to a marked tile. The ice you leave sinks."}</p>
  </>;
}
