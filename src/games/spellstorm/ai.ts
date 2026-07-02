import type { Rng } from "@/lib/rng";
import type { AiWordPlan, Mage, Spell, SpellDifficulty } from "./types";

const SPEEDS = {
  easy: [120, 180, 0.08],
  medium: [180, 240, 0.03],
  hard: [260, 330, 0.008],
} as const;

export function planAiWord(
  length: number,
  difficulty: SpellDifficulty,
  slowed: boolean,
  rng: Rng,
): AiWordPlan {
  const [low, high, typoChance] = SPEEDS[difficulty];
  const wpm = low + rng.next() * (high - low);
  const correctedTypo = rng.next() < typoChance;
  const base = (length / 5 / wpm) * 60_000;
  return {
    durationMs: Math.round(base * (slowed ? 1.55 : 1) + (correctedTypo ? 420 : 0)),
    correctedTypo,
  };
}

export function chooseAiSpell(
  ai: Mage,
  player: Mage,
  difficulty: SpellDifficulty,
  remainingSeconds: number,
  rng: Rng,
): Spell {
  if (difficulty === "easy") return rng.pick(["fire", "ice", "shield"] as const);
  if (difficulty === "medium") {
    if (ai.health < 30 && ai.shield < 10) return "shield";
    return rng.next() < 0.72 ? "fire" : "ice";
  }
  const utilities: Record<Spell, number> = {
    fire: Math.min(18, player.health + player.shield) * 1.25 + (player.health <= 18 ? 30 : 0),
    ice: (remainingSeconds > 6 ? 13 : 2) + (player.combo >= 3 ? 5 : 0),
    shield: Math.min(15, Math.max(0, 35 - ai.shield)) + (ai.health < 35 ? 12 : 0),
  };
  return (Object.keys(utilities) as Spell[]).sort((a, b) => utilities[b] - utilities[a])[0];
}

