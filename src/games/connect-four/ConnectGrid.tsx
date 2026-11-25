import { useId } from "react";
import { useLocale } from "@/context/LocaleContext";
import { COLUMNS, getDropRow } from "./logic";
import type { BoardPosition, ConnectBoard, ConnectPiece, ConnectRoundOutcome } from "./types";

type GridProps = {
  board: ConnectBoard;
  myPiece: ConnectPiece;
  opponent: string;
  outcome?: ConnectRoundOutcome | null;
  lastMove?: BoardPosition | null;
  canPlay?: boolean;
  onPlay?: (column: number) => void;
};

export function ConnectGrid({ board, myPiece, opponent, outcome, lastMove, canPlay, onPlay }: GridProps) {
  const { t } = useLocale();
  const boardId = useId();
  const copy = t.connectFour;
  return <div className="connect-board" role="group" aria-label={copy.boardLabel}>
    {Array.from({ length: COLUMNS }, (_, column) => {
      const landing = getDropRow(board, column);
      const stack = board.map(row => row[column]).reverse().filter(piece => piece !== null);
      const label = copy.columnLabel(column + 1);
      const stackText = stack.length ? copy.stack(stack.map(piece => piece === myPiece ? t.common.you : opponent).join(", ")) : copy.emptyColumn;
      const winning = outcome?.line?.some(cell => cell.column === column);
      const description = winning ? stackText + " · " + copy.winningLine : stackText;
      const cells = board.map((row, index) => {
        const piece = row[column];
        const latest = lastMove?.row === index && lastMove.column === column;
        const marked = outcome?.line?.some(cell => cell.row === index && cell.column === column);
        return <span aria-hidden="true" key={index} className={`connect-slot${marked ? " winning" : ""}${index === landing && canPlay ? " landing" : ""}`}>
          {piece && <span className={`connect-piece ${piece === myPiece ? "red" : "yellow"}${latest ? " dropping" : ""}`} />}
        </span>;
      });
      if (!onPlay) return <div className="connect-column" key={column} role="img" aria-label={label + ". " + description}>{cells}</div>;
      return <button type="button" className="connect-column" key={column}
        aria-label={label} aria-describedby={boardId + column} disabled={!canPlay || landing === null}
        onClick={() => onPlay(column)}
        onKeyDown={event => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          const columns = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>("button:enabled"));
          const index = columns.indexOf(event.currentTarget) + (event.key === "ArrowLeft" ? -1 : 1);
          event.preventDefault();
          columns[(index + columns.length) % columns.length]?.focus();
        }}>
        <span id={boardId + column} hidden>{description}</span>
        <span className="connect-preview" aria-hidden="true" />{cells}
      </button>;
    })}
  </div>;
}

export function RoundReview({ round, ...grid }: GridProps & { round: number }) {
  const { t } = useLocale();
  const line = grid.outcome?.line;
  const start = line?.[0];
  const end = line?.at(-1);
  let result = t.connectFour.drawRound;
  if (start && end) {
    const kind = start.row === end.row ? "horizontal" : start.column === end.column ? "vertical" : "diagonal";
    const first = Math.min(start.column, end.column) + 1;
    const last = Math.max(start.column, end.column) + 1;
    const columns = first === last ? t.connectFour.columnLabel(first) : t.connectFour.columnRange(first, last);
    result = t.connectFour.lineDirection[kind] + " · " + columns;
  }
  return <details className="connect-review">
    <summary>{t.connectFour.reviewRound(round)}</summary>
    {grid.outcome && <p>{result}</p>}
    <ConnectGrid {...grid} />
  </details>;
}
