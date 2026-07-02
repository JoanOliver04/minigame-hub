import type { Mage, Spell } from "./types";
import { SPELL_COST } from "./types";

export function createMage(): Mage {
  return { health: 100, shield: 0, energy: 0, combo: 0, words: 0, slowed: false };
}

export function completeWord(mage: Mage, length: number): Mage {
  return {
    ...mage,
    energy: mage.energy + length,
    combo: mage.combo + 1,
    words: mage.words + 1,
  };
}

export function registerTypo(mage: Mage): Mage {
  return mage.combo === 0 ? mage : { ...mage, combo: 0 };
}

export function dealDamage(mage: Mage, amount: number): Mage {
  const absorbed = Math.min(mage.shield, amount);
  return {
    ...mage,
    shield: mage.shield - absorbed,
    health: Math.max(0, mage.health - amount + absorbed),
  };
}

export function castSpell(
  caster: Mage,
  target: Mage,
  spell: Spell,
): { caster: Mage; target: Mage } | null {
  if (caster.energy < SPELL_COST) return null;
  let nextCaster = { ...caster, energy: caster.energy - SPELL_COST };
  let nextTarget = { ...target };
  if (spell === "fire") nextTarget = dealDamage(nextTarget, 18);
  if (spell === "ice") nextTarget = { ...nextTarget, slowed: true };
  if (spell === "shield") nextCaster = { ...nextCaster, shield: nextCaster.shield + 15 };
  return { caster: nextCaster, target: nextTarget };
}

export function matchOutcome(player: Mage, ai: Mage): "player" | "ai" | "tie" {
  if (player.health !== ai.health) return player.health > ai.health ? "player" : "ai";
  return "tie";
}
