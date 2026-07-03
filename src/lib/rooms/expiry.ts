import type { RoomDoc } from "./types";

/**
 * Client-side mirror of the `notExpired()` check in firestore.rules. This
 * is a UX convenience (instant feedback, no wasted round-trip to a write
 * Firestore will reject) — the Security Rule is the actual enforcement,
 * this can't be relied on alone since a client's clock/code can lie.
 */
export function isRoomExpired(room: Pick<RoomDoc, "expiresAt">): boolean {
  return room.expiresAt.toMillis() <= Date.now();
}
