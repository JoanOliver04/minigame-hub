"use client";

import { useSyncExternalStore } from "react";
import { GAMES } from "@/games/registry";
import { readValue, subscribeStorage, writeValue } from "@/lib/browserStorage";

const key = (id: string) => "miniHubFavorite_v1:" + id;
const snapshot = () => GAMES.filter((game) => readValue(key(game.id)) === "1").map((game) => game.id).join(" ");

export function useFavorites() {
  const ids = useSyncExternalStore(subscribeStorage, snapshot, () => "");
  return new Set(ids ? ids.split(" ") : []);
}

export function toggleFavorite(id: string) {
  writeValue(key(id), readValue(key(id)) === "1" ? null : "1");
}
