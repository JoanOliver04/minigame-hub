import { useLocale } from "@/context/LocaleContext";
import type { BoardProps } from "../duels/types";
import { boxScores, type BoxesState } from "./logic";

const pointName = (row: number, col: number) => String.fromCharCode(65 + col) + (row + 1);
const marks = ["", "×", "○"];

export function BoxesBoard({ state, names, onPlay, reviewing }: BoardProps<BoxesState, number>) {
  const { locale } = useLocale();
  const es = locale === "es";
  const scores = boxScores(state.owners);
  return <>
    <div className="duel-scores">{names.map((name, i) => <div key={i}>
      <span>{marks[i + 1]} {name}</span><strong>{scores[i]} / 9</strong>
    </div>)}</div>
    <div className="boxes-board" role="group" aria-label={es ? "Tablero de puntos y cajas" : "Dots and boxes board"}>
      {Array.from({ length: 49 }, (_, i) => {
        const y = Math.floor(i / 7), x = i % 7;
        const row = Math.floor(y / 2), col = Math.floor(x / 2);
        if (!(x % 2) && !(y % 2)) return <span key={i} className="boxes-dot" aria-hidden="true" />;
        if (x % 2 && y % 2) {
          const owner = state.owners[row * 3 + col];
          return <span key={i} className="boxes-owner" data-owner={owner}
            aria-label={owner ? names[owner - 1] : undefined}>{marks[owner]}</span>;
        }
        const horizontal = y % 2 === 0;
        const edge = horizontal ? row * 3 + col : 12 + row * 4 + col;
        const drawn = Boolean(state.lines & (1 << edge));
        const ends = pointName(row, col) + "–" + pointName(row + Number(!horizontal), col + Number(horizontal));
        return <button key={i} type="button" className="boxes-edge" data-direction={horizontal ? "h" : "v"}
          data-drawn={drawn} data-last={edge === state.last} disabled={drawn || !onPlay}
          aria-label={(es ? "Línea " : "Line ") + ends} onClick={() => onPlay?.(edge)} />;
      })}
    </div>
    {(!reviewing || (state.gained > 0 && state.winner === null)) && <p className="duel-note" role="status">{state.gained > 0 && state.winner === null
      ? es ? `${names[state.active]} cierra ${state.gained === 1 ? "una caja" : "dos cajas"} y repite turno.`
        : `${names[state.active]} closed ${state.gained === 1 ? "one box" : "two boxes"} and plays again.`
      : es ? "Elige una línea de puntos. El cuarto lado de una caja te da un punto y otro turno."
        : "Choose a dotted line. Drawing the fourth side of a box earns a point and another turn."}</p>}
  </>;
}
