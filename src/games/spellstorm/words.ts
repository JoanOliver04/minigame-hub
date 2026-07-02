import type { Rng } from "@/lib/rng";
import type { Element, StormWord } from "./types";

export const EN_WORDS = [
  "blaze", "ember", "flame", "spark", "meteor", "dragon", "cinder", "volcano",
  "frost", "glacier", "winter", "crystal", "frozen", "arctic", "icicle", "tundra",
  "barrier", "armor", "aegis", "guard", "citadel", "shelter", "bastion", "rampart",
  "thunder", "tempest", "arcane", "rune", "mystic", "comet", "storm", "prism",
] as const;

export const ES_WORDS = [
  "llama", "brasa", "fuego", "chispa", "meteoro", "dragón", "ceniza", "volcán",
  "hielo", "glaciar", "invierno", "cristal", "helado", "ártico", "escarcha", "tundra",
  "barrera", "armadura", "escudo", "guarda", "fortín", "refugio", "bastión", "muralla",
  "trueno", "tormenta", "arcano", "runa", "mágico", "cometa", "bruma", "prisma",
] as const;

export function normalizeWord(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
}

export function createWordDeck(locale: "en" | "es", rng: Rng, count = 96): StormWord[] {
  const source = locale === "es" ? ES_WORDS : EN_WORDS;
  const elements: Element[] = ["fire", "ice", "shield"];
  const deck: StormWord[] = [];
  let previous = "";
  while (deck.length < count) {
    const candidates = source.filter((word) => normalizeWord(word).slice(0, 5) !== previous.slice(0, 5));
    const display = rng.pick(candidates);
    const normalized = normalizeWord(display);
    deck.push({ display, normalized, element: elements[deck.length % elements.length] });
    previous = normalized;
  }
  return deck;
}
