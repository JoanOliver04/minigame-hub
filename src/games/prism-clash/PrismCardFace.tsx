import type { PrismCard, PrismColor } from "./types";

const SYMBOLS = { freeze: "❄", draw2: "+2", prism: "✦" } as const;

export function PrismCardFace({
  card,
  label,
  selected = false,
  disabled = false,
  onClick,
}: {
  card?: PrismCard;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  if (!card) {
    return (
      <div className="prism-card back" aria-label={label}>
        <span>✦</span>
      </div>
    );
  }
  const symbol = card.kind === "number" ? card.value : SYMBOLS[card.kind];
  const className = `prism-card ${card.color ?? "wild"}${selected ? " selected" : ""}`;
  if (!onClick) {
    return (
      <div className={className} aria-label={label}>
        <small>{symbol}</small><strong>{symbol}</strong><small>{symbol}</small>
      </div>
    );
  }
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick} aria-label={label}>
      <small>{symbol}</small><strong>{symbol}</strong><small>{symbol}</small>
    </button>
  );
}

export function ColorPicker({
  colors,
  label,
  colorLabel,
  onPick,
}: {
  colors: PrismColor[];
  label: string;
  colorLabel: (color: PrismColor) => string;
  onPick: (color: PrismColor) => void;
}) {
  return (
    <div className="prism-color-picker" role="group" aria-label={label}>
      {colors.map((color) => (
        <button key={color} type="button" className={color} onClick={() => onPick(color)}>
          <span aria-hidden="true" /> {colorLabel(color)}
        </button>
      ))}
    </div>
  );
}
