import type { ButtonHTMLAttributes } from "react";

/** Timing games score the start of a press, including a keyboard activation. */
export function timedPress(action: () => void): ButtonHTMLAttributes<HTMLButtonElement> {
  return {
    onPointerDown(event) {
      if (event.button === 0) action();
    },
    onKeyDown(event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) action();
    },
    onKeyUp(event) {
      if (event.key === " ") event.preventDefault();
    },
    onClick(event) {
      // Assistive technology can invoke a button without a preceding press.
      if (event.detail === 0) action();
    },
  };
}
