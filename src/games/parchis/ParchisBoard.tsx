import { bridgeCells, globalCell, SAFE_CELLS, START_BY_COLOR } from "./logic";
import type { ParchisColor, ParchisGameState } from "./types";

interface Point { x: number; y: number }
export type ParchisPieceStatus = "home" | "track" | "lane" | "goal";

function trackPoint(cell: number): Point {
  const angle = ((90 + cell * (360 / 68)) * Math.PI) / 180;
  return { x: 50 + Math.cos(angle) * 43, y: 50 + Math.sin(angle) * 43 };
}

function lanePoint(color: ParchisColor, progress: number): Point {
  const step = progress - 68;
  return color === "red"
    ? { x: 50, y: 80 - step * 4.7 }
    : { x: 50, y: 20 + step * 4.7 };
}

function homePoint(color: ParchisColor, pieceId: number, count: number): Point {
  const columns = count === 2 ? 2 : 2;
  const col = pieceId % columns;
  const row = Math.floor(pieceId / columns);
  const center = color === "red" ? { x: 24, y: 74 } : { x: 76, y: 26 };
  return {
    x: center.x + (col - 0.5) * 7,
    y: center.y + (row - (count === 2 ? 0 : 0.5)) * 7,
  };
}

function goalPoint(color: ParchisColor, pieceId: number, count: number): Point {
  const spread = count === 2 ? 4 : 3.2;
  return {
    x: 50 + (pieceId - (count - 1) / 2) * spread,
    y: color === "red" ? 52.5 : 47.5,
  };
}

function piecePoint(
  state: ParchisGameState,
  actor: string,
  pieceId: number,
): Point {
  const piece = state.pieces[actor][pieceId];
  const color = state.colors[actor];
  if (piece.progress === -1) return homePoint(color, pieceId, state.pieceCount);
  if (piece.progress === 75) return goalPoint(color, pieceId, state.pieceCount);
  if (piece.progress >= 68) return lanePoint(color, piece.progress);
  return trackPoint(globalCell(state, actor, piece.progress)!);
}

export function ParchisBoard({
  state,
  viewer,
  legal,
  boardLabel,
  pieceLabel,
  onMove,
}: {
  state: ParchisGameState;
  viewer: string;
  legal: number[];
  boardLabel: string;
  pieceLabel: (mine: boolean, piece: number, status: ParchisPieceStatus) => string;
  onMove: (pieceId: number) => void;
}) {
  const bridges = bridgeCells(state);
  const actors = state.order;
  return (
    <div className="parchis-board" role="group" aria-label={boardLabel}>
      <div className="parchis-cross vertical" />
      <div className="parchis-cross horizontal" />
      <div className="parchis-yard red" aria-hidden="true"><span /></div>
      <div className="parchis-yard blue" aria-hidden="true"><span /></div>
      <div className="parchis-goal" aria-hidden="true">★</div>

      {Array.from({ length: 68 }, (_, cell) => {
        const point = trackPoint(cell);
        const startColor =
          cell === START_BY_COLOR.red ? " red-start" : cell === START_BY_COLOR.blue ? " blue-start" : "";
        return (
          <span
            key={cell}
            className={`parchis-cell${SAFE_CELLS.has(cell) ? " safe" : ""}${startColor}${bridges.has(cell) ? " bridge" : ""}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            aria-hidden="true"
          >
            {SAFE_CELLS.has(cell) && "•"}
          </span>
        );
      })}

      {actors.flatMap((actor) =>
        Array.from({ length: 7 }, (_, index) => {
          const progress = 68 + index;
          const point = lanePoint(state.colors[actor], progress);
          return (
            <span
              key={`${actor}-lane-${progress}`}
              className={`parchis-cell lane ${state.colors[actor]}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              aria-hidden="true"
            />
          );
        }),
      )}

      {actors.flatMap((actor) =>
        state.pieces[actor].map((piece) => {
          const point = piecePoint(state, actor, piece.id);
          const sameSpot = actors.flatMap((seat) =>
            state.pieces[seat].filter((candidate) => {
              if (piece.progress < 0 || piece.progress >= 68) return false;
              return (
                globalCell(state, seat, candidate.progress) ===
                globalCell(state, actor, piece.progress)
              );
            }),
          );
          const rank = sameSpot.findIndex(
            (candidate) => candidate.id === piece.id && state.pieces[actor].includes(candidate),
          );
          const offset = sameSpot.length > 1 ? (rank <= 0 ? -1.25 : 1.25) : 0;
          const status: ParchisPieceStatus =
            piece.progress === -1
              ? "home"
              : piece.progress === 75
                ? "goal"
                : piece.progress >= 68
                  ? "lane"
                  : "track";
          const mine = actor === viewer;
          return (
            <button
              key={`${actor}-${piece.id}`}
              type="button"
              className={`parchis-piece ${state.colors[actor]}${mine && legal.includes(piece.id) ? " legal" : ""}`}
              style={{ left: `${point.x + offset}%`, top: `${point.y}%` }}
              disabled={!mine || !legal.includes(piece.id)}
              onClick={() => onMove(piece.id)}
              aria-label={pieceLabel(mine, piece.id + 1, status)}
            >
              {piece.id + 1}
            </button>
          );
        }),
      )}
    </div>
  );
}
