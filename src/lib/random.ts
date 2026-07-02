/** Inclusive integer in [lo, hi]. */
export function randomInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
