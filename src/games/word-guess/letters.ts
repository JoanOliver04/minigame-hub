/**
 * Letter folding for accent-insensitive matching.
 *
 * Spanish words are stored with their real accents (DELFÍN, ESPAÑA, LIMÓN),
 * but the player guesses base letters: pressing E reveals every É too. Ü folds
 * to U. Ñ is deliberately NOT folded — it is a distinct letter of the Spanish
 * alphabet and gets its own key.
 */

import type { WordLang } from "./types";

const FOLD_MAP: Record<string, string> = {
  Á: "A", À: "A", Ä: "A", Â: "A",
  É: "E", È: "E", Ë: "E", Ê: "E",
  Í: "I", Ì: "I", Ï: "I", Î: "I",
  Ó: "O", Ò: "O", Ö: "O", Ô: "O",
  Ú: "U", Ù: "U", Ü: "U", Û: "U",
};

/** Uppercase a single character and collapse accents to their base letter. */
export function foldLetter(char: string): string {
  const upper = char.toUpperCase();
  return FOLD_MAP[upper] ?? upper;
}

/** Fold an entire string letter by letter (preserves length and Ñ). */
export function foldWord(word: string): string {
  return [...word].map(foldLetter).join("");
}

export const ALPHABET_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
/** Spanish base alphabet: Ñ sits between N and O, per the RAE ordering. */
export const ALPHABET_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export function alphabetFor(lang: WordLang): string[] {
  return lang === "es" ? ALPHABET_ES : ALPHABET_EN;
}
