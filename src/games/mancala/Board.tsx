import { useLocale } from "@/context/LocaleContext";
import { otherSeat, type BoardProps } from "../duels/types";
import { pitsOf, storeOf, type MancalaState } from "./logic";

export function MancalaBoard({ state, names, onPlay, viewer = 0 }: BoardProps<MancalaState, number>) {
  const { locale } = useLocale();
  const es = locale === "es";
  const rows = [otherSeat(viewer), viewer];
  return <>
    <div className="sowing-board" role="group" aria-label={es ? "Tablero de Mancala" : "Mancala board"}>
      {rows.map(seat => {
        const near = seat === viewer;
        const pits = pitsOf(seat);
        const store = storeOf(seat);
        return <section className="sowing-row" key={seat} data-near={near} aria-label={names[seat]}>
          <div className="sowing-caption"><strong>{names[seat]} <span aria-hidden="true">{near ? "→" : "←"}</span></strong>
            <span className="sowing-store" data-last={state.landed === store}>
              {es ? "Granero" : "Store"} <b>{state.cups[store]}</b>
            </span></div>
          <div className="sowing-pits">{(near ? pits : pits.reverse()).map(pit => {
            const seeds = state.cups[pit];
            const extra = seeds > 0 && seeds % 13 === store - pit;
            const legal = Boolean(onPlay && state.active === seat && seeds);
            const label = es ? `Hoyo ${pit % 7 + 1}, ${seeds} semillas` : `Pit ${pit % 7 + 1}, ${seeds} seeds`;
            return <button key={pit} className="sowing-pit" type="button" disabled={!legal}
              data-from={state.from === pit} data-last={state.landed === pit}
              aria-label={label + (legal && extra ? (es ? ", cae en tu granero" : ", lands in your store") : "")}
              onClick={() => onPlay?.(pit)}>
              <b>{seeds}</b>
              <span className="sowing-seeds" aria-hidden="true">{Array.from({ length: Math.min(5, seeds) }, (_, i) => <i key={i} />)}</span>
              {legal && extra && <span className="sowing-bonus" aria-hidden="true">↻</span>}
            </button>;
          })}</div>
        </section>;
      })}
    </div>
    <p className="duel-note" role="status">{state.captured
      ? es ? `Captura de ${state.captured} semillas.` : `${state.captured} seeds captured.`
      : state.again ? es ? "Última semilla en el granero. ¡Turno extra!" : "Last seed in the store. Extra turn!"
      : es ? "Siembra desde un hoyo de tu fila. ↻ indica que la última semilla caerá en tu granero."
        : "Sow from a pit in your row. ↻ means the last seed lands in your store."}</p>
  </>;
}
