/**
 * Session-wide gameplay settings (not persisted, defaults on).
 * Module-level state is fine here: client-only, read at action time.
 */

let useDelay = true;

/** Whether the AI simulates a "thinking" pause before acting. */
export function getUseDelay() {
  return useDelay;
}

export function setUseDelay(value: boolean) {
  useDelay = value;
}
