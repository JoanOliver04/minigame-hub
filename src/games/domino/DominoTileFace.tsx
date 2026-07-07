"use client";

import type { DominoBoardTile, DominoTile } from "./types";

interface Props {
  tile: DominoTile | DominoBoardTile;
  selected?: boolean;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}

function Pips({ value }: { value: number }) {
  return <span className={`domino-pips p${value}`} aria-hidden="true">{Array.from({ length: value }, (_, i) => <i key={i} />)}</span>;
}

export function DominoTileFace({ tile, selected, disabled, label, onClick }: Props) {
  const left = "left" in tile ? tile.left : tile.a;
  const right = "right" in tile ? tile.right : tile.b;
  return (
    <button
      type="button"
      className={`domino-tile${selected ? " selected" : ""}${left === right ? " double" : ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      <Pips value={left} />
      <Pips value={right} />
    </button>
  );
}
