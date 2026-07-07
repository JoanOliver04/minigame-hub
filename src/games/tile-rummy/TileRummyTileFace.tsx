"use client";

import type { TileRummyTile } from "./types";

interface Props {
  tile: TileRummyTile;
  selected?: boolean;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}

export function TileRummyTileFace({ tile, selected, disabled, label, onClick }: Props) {
  return (
    <button
      type="button"
      className={`tile-rummy-tile ${tile.color}${selected ? " selected" : ""}${tile.joker ? " joker" : ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {tile.joker ? <span>★</span> : <span>{tile.value}</span>}
    </button>
  );
}
