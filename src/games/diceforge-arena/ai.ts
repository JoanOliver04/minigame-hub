import type { Rng } from "@/lib/rng";
import { buyUpgrade, scoreRoll, shownFaces } from "./logic";
import type { Face, Fighter, ForgeDifficulty, Offer, RollResult } from "./types";

type Opponent = Pick<Fighter, "health" | "shield">;

function rollValue(result: RollResult, fighter: Fighter, opponent?: Opponent): number {
  if (!opponent) return result.damage * 1.15 + result.shield + result.energy * 0.8 + result.discount * 1.5;
  const damage = Math.max(0, result.damage - opponent.shield);
  const urgency = fighter.health <= 8 ? 1.7 : fighter.health <= 16 ? 1.25 : 0.9;
  const shieldUtility = result.shield * urgency / (1 + fighter.shield * 0.06);
  const lethal = damage >= opponent.health ? 6 : 0;
  return damage * 1.35 + (result.damage - damage) * 0.55 + shieldUtility +
    result.energy * 0.65 + result.discount + lethal;
}

export function chooseLock(
  fighter: Fighter,
  roll: number[],
  difficulty: ForgeDifficulty,
  rng: Rng,
  opponent?: Opponent,
): number {
  if (difficulty === "easy") return rng.int(0, roll.length - 1);
  let selected = 0;
  let best = -Infinity;
  for (let lock = 0; lock < roll.length; lock++) {
    const [first, second] = roll.map((_, index) => index).filter((index) => index !== lock);
    const next = roll.slice();
    let sum = 0;
    for (let a = 0; a < fighter.dice[first].length; a++) {
      next[first] = a;
      for (let b = 0; b < fighter.dice[second].length; b++) {
        next[second] = b;
        sum += rollValue(scoreRoll(shownFaces(fighter.dice, next)), fighter,
          difficulty === "hard" ? opponent : undefined);
      }
    }
    const average = sum / (fighter.dice[first].length * fighter.dice[second].length);
    if (average > best) {
      selected = lock;
      best = average;
    }
  }
  return selected;
}

export function rerollExcept(fighter: Fighter, roll: number[], lock: number, rng: Rng): number[] {
  return roll.map((face, index) => index === lock ? face : rng.int(0, fighter.dice[index].length - 1));
}

function faceValue(face: Face): number {
  if (face.kind === "wild") return 2.4;
  return face.value * (face.kind === "damage" ? 1.2 : face.kind === "shield" ? 1 : 0.8);
}

function replacementGain(
  fighter: Fighter,
  die: number,
  face: number,
  offer: Offer,
  opponent: Opponent | undefined,
): number {
  const replacement = fighter.dice.map((faces, index) => index === die
    ? faces.map((current, position) => position === face ? offer.face : current) : faces);
  const roll = [0, 0, 0];
  roll[die] = face;
  const [first, second] = [0, 1, 2].filter((index) => die !== index);
  let value = 0;
  for (let a = 0; a < fighter.dice[first].length; a++) {
    roll[first] = a;
    for (let b = 0; b < fighter.dice[second].length; b++) {
      roll[second] = b;
      value += rollValue(scoreRoll(shownFaces(replacement, roll)), fighter, opponent) -
        rollValue(scoreRoll(shownFaces(fighter.dice, roll)), fighter, opponent);
    }
  }
  return value / (fighter.dice[first].length * fighter.dice[second].length * fighter.dice[die].length);
}

export function choosePurchase(
  fighter: Fighter,
  offers: Offer[],
  difficulty: ForgeDifficulty,
  rng: Rng,
  opponent?: Opponent,
  roundsLeft = 9,
): Fighter {
  if (roundsLeft <= 0) return fighter;
  const affordable = offers.filter((offer) => Math.max(0, offer.cost - fighter.discount) <= fighter.coins);
  if (affordable.length === 0) return fighter;
  const candidates = difficulty === "easy" ? [rng.pick(affordable)] : affordable;
  let purchase: { offer: Offer; die: number; face: number } | undefined;
  let best = 0;
  for (const offer of candidates) {
    const price = Math.max(0, offer.cost - fighter.discount);
    fighter.dice.forEach((faces, die) => faces.forEach((face, index) => {
      if (face.kind === offer.face.kind && face.value === offer.face.value) return;
      const gain = difficulty === "hard"
        ? replacementGain(fighter, die, index, offer, opponent) * roundsLeft
        : faceValue(offer.face) - faceValue(face);
      const utility = gain - price * 0.08;
      if (utility > best) {
        best = utility;
        purchase = { offer, die, face: index };
      }
    }));
  }
  return purchase ? buyUpgrade(fighter, purchase.offer, purchase.die, purchase.face) ?? fighter : fighter;
}
