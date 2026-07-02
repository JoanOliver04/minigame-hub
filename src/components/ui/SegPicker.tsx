"use client";

export interface SegOption {
  value: string;
  label: string;
}

/** Segmented pill picker — one option selected at a time. */
export function SegPicker({
  options,
  value,
  onChange,
}: {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="seg">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? "selected" : ""}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
