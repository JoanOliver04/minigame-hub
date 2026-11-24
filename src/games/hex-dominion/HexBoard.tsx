import { useLocale } from "@/context/LocaleContext";
import { coordinates, winningPath } from "./logic";
import type { HexCell, HexOwner } from "./types";

const radius = 26;
const width = Math.sqrt(3) * radius;

function center(index: number) {
  const [row, column] = coordinates(index);
  return { x: 42 + column * width + row * width / 2, y: 38 + row * radius * 1.5 };
}

function corners(x: number, y: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 180 * (60 * i - 30);
    return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
  }).join(" ");
}

export function HexBoard({ board, viewer = "player", opponent, winner, onPlay }: {
  board: HexCell[];
  viewer?: HexOwner;
  opponent: string;
  winner?: HexOwner | null;
  onPlay?: (index: number) => void;
}) {
  const { t } = useLocale();
  const copy = t.hexDominion;
  const path = winner ? winningPath(board, winner) : [];
  const points = path.map(index => {
    const { x, y } = center(index);
    return `${x},${y}`;
  }).join(" ");
  const horizontal = viewer === "player";
  return <>
    <div className="hex-goal-row">
      <span>{horizontal ? "↔" : "↕"} {copy.yourGoal}</span>
      <span>{horizontal ? "↕" : "↔"} {opponent}</span>
    </div>
    <svg className="hex-board" viewBox="0 0 494 314" role={winner ? "img" : "group"} aria-label={winner ? t.play.winningPath : copy.boardLabel}>
      <path className={`hex-edge ${horizontal ? "ai" : "player"}`} d="M32 6 H314 M177 304 H458" />
      <path className={`hex-edge ${horizontal ? "player" : "ai"}`} d="M10 32 L145 270 M343 35 L478 273" />
      {board.map((owner, i) => {
        const { x, y } = center(i);
        const [row, column] = coordinates(i);
        const playable = !owner && !!onPlay && !winner;
        const side = owner === null ? "empty" : owner === viewer ? "player" : "ai";
        return <polygon key={i} points={corners(x, y)} className={`hex-cell ${side}`}
          role={winner ? undefined : "button"} tabIndex={playable ? 0 : -1} aria-disabled={!playable}
          aria-label={owner ? copy.namedCell(row + 1, column + 1, owner === viewer ? t.common.you : opponent) : copy.emptyCell(row + 1, column + 1)}
          onClick={() => { if (playable) onPlay?.(i); }}
          onKeyDown={event => {
            if (playable && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onPlay?.(i);
            }
          }} />;
      })}
      {points && <polyline className="hex-path" points={points} />}
    </svg>
    <div className="hex-legend"><span><i className="player" />{copy.youLegend}</span><span><i className="ai" />{opponent}</span></div>
  </>;
}
