import { readValue, writeValue } from "@/lib/browserStorage";
import { getGame } from "@/games/registry";
import { normalizeRoomCode } from "./code";

export const recentRoomKey = "miniHubRecentRoom";
export type RecentRoom = { code: string; gameId: string; expiresAt: number };

export function parseRecentRoom(raw: string | null): RecentRoom | null {
  if (!raw) return null;
  try {
    const room = JSON.parse(raw);
    if (typeof room?.code !== "string" || normalizeRoomCode(room.code) !== room.code ||
      !getGame(room.gameId)?.supportsMultiplayer || !Number.isSafeInteger(room.expiresAt)) return null;
    return { code: room.code, gameId: room.gameId, expiresAt: room.expiresAt };
  } catch {
    return null;
  }
}

export function rememberRoom(room: RecentRoom) {
  const next = JSON.stringify(room);
  if (readValue(recentRoomKey) !== next) writeValue(recentRoomKey, next);
}

export function forgetRoom(code: string) {
  if (parseRecentRoom(readValue(recentRoomKey))?.code === code) writeValue(recentRoomKey, null);
}
