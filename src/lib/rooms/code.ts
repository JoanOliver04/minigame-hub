/** Excludes 0/O and 1/I — easy to misread out loud or in a small font. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
const ROOM_CODE = new RegExp(`^[${CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`, "i");

export function generateRoomCode(): string {
  // The 32-character alphabet divides 256 evenly, so each symbol is uniform.
  const random = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  return Array.from(random, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function normalizeRoomCode(value: string): string | null {
  const code = value.trim();
  return ROOM_CODE.test(code) ? code.toUpperCase() : null;
}

/** Always return a local room code, never an invitation's destination URL. */
export function roomCodeFromInvite(value: string, origin: string): string | null {
  const code = normalizeRoomCode(value);
  if (code) return code;
  try {
    const url = new URL(value.trim());
    if (url.origin !== origin || url.username || url.password) return null;
    const path = /^\/rooms\/([^/]+)\/?$/.exec(url.pathname);
    return path ? normalizeRoomCode(path[1]) : null;
  } catch {
    return null;
  }
}
