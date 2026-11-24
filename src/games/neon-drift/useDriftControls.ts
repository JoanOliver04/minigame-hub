"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import type { ControlInput } from "./types";

type Action = "left" | "right" | "brake" | "boost";
type RaceInput = Pick<ControlInput, "steer" | "brake" | "boost">;

const keys = new Map<string, Action>([
  ["arrowleft", "left"], ["a", "left"], ["arrowright", "right"], ["d", "right"],
  ["arrowdown", "brake"], ["s", "brake"], [" ", "boost"],
]);

/** Resolve actions held by either keyboard or touch. Throttle stays automatic. */
export function useDriftControls(enabled: boolean, apply: (input: RaceInput) => void) {
  const keyboard = useRef(new Map<string, Action>());
  const pointers = useRef(new Map<number, Action>());
  const sync = useCallback(() => {
    const held = new Set([...keyboard.current.values(), ...pointers.current.values()]);
    apply({
      steer: Number(held.has("right")) - Number(held.has("left")),
      brake: Number(held.has("brake")),
      boost: held.has("boost"),
    });
  }, [apply]);

  useEffect(() => {
    if (!enabled) return;
    const held = keyboard.current;
    const activePointers = pointers.current;
    function clear() {
      held.clear();
      activePointers.clear();
      sync();
    }
    function down(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      let action = keys.get(event.key.toLowerCase());
      if (target instanceof HTMLElement) {
        if (target.closest("input, select, textarea, [contenteditable]:not([contenteditable='false'])")) return;
        if (event.key === " " || event.key === "Enter") {
          const control = target.closest<HTMLElement>("[data-drift-action]");
          if (control) action = control.dataset.driftAction as Action;
          else if (target.closest("button, a, summary")) return;
        }
      }
      if (!action) return;
      held.set(event.code || event.key.toLowerCase(), action);
      event.preventDefault();
      sync();
    }
    function up(event: KeyboardEvent) {
      if (held.delete(event.code || event.key.toLowerCase())) sync();
    }
    function visibilityChanged() {
      if (document.hidden) clear();
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibilityChanged);
      clear();
    };
  }, [enabled, sync]);

  function release(event: PointerEvent<HTMLButtonElement>) {
    if (pointers.current.delete(event.pointerId)) sync();
  }

  return (action: Action) => ({
    disabled: !enabled,
    "data-drift-action": action,
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (!enabled || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, action);
      sync();
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
  });
}
