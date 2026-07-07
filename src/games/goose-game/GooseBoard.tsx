import { SPECIAL_BY_SQUARE } from "./logic";
import type { GooseGameState, GooseSpecial } from "./types";

const ICONS: Record<GooseSpecial, string> = {
  goose: "🪿",
  bridge: "🌉",
  inn: "🏠",
  dice: "🎲",
  well: "🕳",
  maze: "🌀",
  prison: "🔒",
  death: "💀",
  goal: "🏆",
};

function squarePosition(square: number): { row: number; column: number } {
  const index = square - 1;
  const rowFromBottom = Math.floor(index / 9);
  const offset = index % 9;
  const column = rowFromBottom % 2 === 0 ? offset + 1 : 9 - offset;
  return { row: 7 - rowFromBottom, column };
}

export function GooseBoard({
  state,
  viewer,
  boardLabel,
  squareLabel,
  tokenLabel,
}: {
  state: GooseGameState;
  viewer: string;
  boardLabel: string;
  squareLabel: (square: number, special?: GooseSpecial) => string;
  tokenLabel: (actor: string, square: number) => string;
}) {
  const opponent = state.order.find((actor) => actor !== viewer)!;
  return (
    <>
      <div className="goose-start">
        <span>{state.positions[viewer] === 0 && <i className="goose-token player" aria-label={tokenLabel(viewer, 0)}>●</i>}</span>
        <b>START</b>
        <span>{state.positions[opponent] === 0 && <i className="goose-token rival" aria-label={tokenLabel(opponent, 0)}>●</i>}</span>
      </div>
      <div className="goose-board" role="group" aria-label={boardLabel}>
        {Array.from({ length: 63 }, (_, index) => {
          const square = index + 1;
          const special = SPECIAL_BY_SQUARE[square];
          const position = squarePosition(square);
          return (
            <div
              key={square}
              className={`goose-square${special ? ` special ${special}` : ""}`}
              style={{ gridRow: position.row, gridColumn: position.column }}
              aria-label={squareLabel(square, special)}
            >
              <small>{square}</small>
              {special && <span aria-hidden="true">{ICONS[special]}</span>}
              <div className="goose-tokens">
                {state.positions[viewer] === square && (
                  <i className="goose-token player" aria-label={tokenLabel(viewer, square)}>●</i>
                )}
                {state.positions[opponent] === square && (
                  <i className="goose-token rival" aria-label={tokenLabel(opponent, square)}>●</i>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
