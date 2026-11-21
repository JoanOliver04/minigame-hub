export const GAME_CATEGORIES = ["strategy", "logic", "cards", "action"] as const;
export type GameCategory = (typeof GAME_CATEGORIES)[number];

/** Lightweight metadata shared by the lobby, score table and routing. */
export interface GameDefinition {
  /** Stable id: route segment (/games/<id>), ScoreStore key, and dictionary
   *  key under `t.gamesMeta` for the display name/description. */
  id: string;
  /** Emoji icon for the hub card. */
  icon: string;
  category: GameCategory;
  /** Whether this game can end in a tie (controls the hub table column). */
  hasTies: boolean;
  supportsMultiplayer: boolean;
}
