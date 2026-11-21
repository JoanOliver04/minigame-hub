"use client";

import { useStoredPreference } from "@/lib/useStoredPreference";

const STORAGE_KEY = "miniHubPlayerName_v1";
export const MAX_PLAYER_NAME_LENGTH = 24;

function parseName(value: string | null) {
  return value?.slice(0, MAX_PLAYER_NAME_LENGTH) ?? null;
}

export function usePlayerName() {
  return useStoredPreference<string>(STORAGE_KEY, "", parseName);
}
