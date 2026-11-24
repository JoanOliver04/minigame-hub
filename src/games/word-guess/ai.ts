import { alphabetFor, fitsClues, foldWord } from "./letters";
import type { AIGuess, WordDifficulty, WordLang } from "./types";

/** Letter-frequency order (most common first) per language — drives the
 *  Medium AI's letter picks so it plays sensibly in either language. */
const FREQUENCY_BY_LANG: Record<WordLang, string[]> = {
  en: "ETAOINSHRDLCUMWFGYPBVKJXQZ".split(""),
  es: "EAOSRNIDLCTUMPBGVYQHFZJXWKÑ".split(""),
};

export interface AIKnowledge {
  pattern: string;
  guessedLetters: ReadonlySet<string>;
  revealedLetters: ReadonlySet<string>;
  candidatePool: readonly string[];
  lang: WordLang;
  rejectedWords?: ReadonlySet<string>;
}

/** Keep words compatible with every visible hit and every known miss. */
export function filterCandidates(knowledge: AIKnowledge): string[] {
  const {
    pattern,
    guessedLetters,
    revealedLetters,
    candidatePool,
  } = knowledge;
  const tried = new Set([...guessedLetters, ...revealedLetters]);

  return candidatePool.filter((word) => {
    const folded = foldWord(word);
    return !knowledge.rejectedWords?.has(word) && fitsClues(folded, pattern, tried);
  });
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Every revealed position is an observation. Score by the expected number
 * of survivors after revealing the full pattern, then prefer fewer misses.
 */
export function pickInformationLetter(
  candidates: readonly string[],
  availableLetters: readonly string[],
): string {
  let best = availableLetters[0];
  let bestScore = Infinity;
  let fewestMisses = Infinity;
  const words = candidates.map(foldWord);

  for (const letter of availableLetters) {
    const buckets = new Map<string, number>();
    for (const word of words) {
      const pattern = [...word].map((value) => value === letter ? letter : "_").join("");
      buckets.set(pattern, (buckets.get(pattern) ?? 0) + 1);
    }
    const misses = [...buckets].find(([pattern]) => !pattern.includes(letter))?.[1] ?? 0;
    const score = [...buckets.values()].reduce((sum, amount) => sum + amount * amount, 0);
    if (score < bestScore || (score === bestScore && misses < fewestMisses)) {
      best = letter;
      bestScore = score;
      fewestMisses = misses;
    }
  }
  return best;
}

export function chooseAIGuess(
  difficulty: WordDifficulty,
  knowledge: AIKnowledge,
): AIGuess {
  const available = alphabetFor(knowledge.lang).filter(
    (letter) => !knowledge.guessedLetters.has(letter),
  );
  const candidates = filterCandidates(knowledge);
  const hiddenCount = [...knowledge.pattern].filter((letter) => letter === "_").length;

  if (difficulty === "hard" && candidates.length === 1) {
    return { kind: "word", value: candidates[0] };
  }
  if (
    difficulty === "medium" &&
    candidates.length > 0 &&
    candidates.length <= 2 &&
    hiddenCount <= 3
  ) {
    return { kind: "word", value: randomItem(candidates) };
  }
  if (
    difficulty === "easy" &&
    candidates.length === 1 &&
    hiddenCount <= 1
  ) {
    return { kind: "word", value: candidates[0] };
  }

  if (available.length === 0) {
    return { kind: "word", value: candidates[0] ?? knowledge.pattern };
  }
  if (difficulty === "easy") {
    return { kind: "letter", value: randomItem(available) };
  }
  if (difficulty === "medium") {
    const frequency = FREQUENCY_BY_LANG[knowledge.lang];
    return {
      kind: "letter",
      value: frequency.find((letter) => available.includes(letter)) ?? available[0],
    };
  }
  return {
    kind: "letter",
    value: candidates.length ? pickInformationLetter(candidates, available)
      : FREQUENCY_BY_LANG[knowledge.lang].find((letter) => available.includes(letter)) ?? available[0],
  };
}
