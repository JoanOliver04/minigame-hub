import { alphabetFor, foldLetter, foldWord } from "./letters";
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
  const missed = [...guessedLetters].filter((letter) => !revealedLetters.has(letter));

  return candidatePool.filter((word) => {
    const folded = foldWord(word);
    if (folded.length !== pattern.length) return false;
    if (knowledge.rejectedWords?.has(word)) return false;
    if (missed.some((letter) => folded.includes(letter))) return false;

    return [...pattern].every((visible, index) => {
      if (visible !== "_") return foldLetter(word[index]) === foldLetter(visible);
      // A revealed letter would be visible in all of its positions.
      return !revealedLetters.has(foldLetter(word[index]));
    });
  });
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Hard mode scores letters by how evenly they divide the remaining candidate
 * set. A 50/50 split removes the most uncertainty regardless of the outcome;
 * occurrence frequency is the deterministic secondary signal.
 */
export function pickInformationLetter(
  candidates: readonly string[],
  availableLetters: readonly string[],
): string {
  let best = availableLetters[0];
  let bestScore = -1;

  for (const letter of availableLetters) {
    const containing = candidates.filter((word) => foldWord(word).includes(letter)).length;
    const split = Math.min(containing, candidates.length - containing);
    const score = split * (candidates.length + 1) + containing;
    if (score > bestScore) {
      best = letter;
      bestScore = score;
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
    value: pickInformationLetter(candidates, available),
  };
}
