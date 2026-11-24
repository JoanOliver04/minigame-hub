import { foldWord } from "./letters";
import type { WordCategory, WordDifficulty, WordLang } from "./types";

/**
 * English words are plain A-Z. Spanish words keep their real accents and Ñ
 * (DELFÍN, ESPAÑA, LIMÓN): the game matches letters by base form (see
 * ./letters — pressing E reveals É), while Ñ is a key of its own. The final
 * filter keeps only words whose folded form is A-Z + Ñ, so a stray unsupported
 * character can never break the keyboard or the candidate filter.
 */
const SOURCE_WORDS: Record<WordLang, Record<WordCategory, readonly string[]>> = {
  en: {
    animals: [
      "BEAR", "DUCK", "FROG", "GOAT", "LION", "WOLF", "HORSE", "MOUSE",
      "OTTER", "PANDA", "SHARK", "TIGER", "BADGER", "DOLPHIN", "GIRAFFE",
      "HAMSTER", "LEOPARD", "PENGUIN", "RABBIT", "TURTLE",
      "BAT", "SEAL", "ZEBRA", "FALCON", "OCTOPUS", "PANTHER", "PLATYPUS", "SQUIRREL", "HEDGEHOG", "ELEPHANT",
    ],
    countries: [
      "CHILE", "CHINA", "EGYPT", "INDIA", "ITALY", "JAPAN", "SPAIN", "BRAZIL",
      "CANADA", "FRANCE", "GREECE", "MEXICO", "NORWAY", "POLAND", "SWEDEN",
      "AUSTRALIA", "GERMANY", "PORTUGAL", "THAILAND", "VENEZUELA",
      "PERU", "KENYA", "GHANA", "ICELAND", "IRELAND", "ESTONIA", "MOROCCO", "VIETNAM", "SENEGAL", "FINLAND",
    ],
    food: [
      "BREAD", "GRAPE", "LEMON", "MANGO", "PASTA", "PIZZA", "SALAD", "APPLE",
      "BURGER", "CARROT", "CHEESE", "COOKIE", "GARLIC", "ORANGE", "PEPPER",
      "AVOCADO", "BROCCOLI", "CHOCOLATE", "PANCAKE", "SPAGHETTI",
      "RICE", "PEAR", "MELON", "WALNUT", "PUMPKIN", "APRICOT", "SPINACH", "CABBAGE", "CINNAMON", "PINEAPPLE",
    ],
    technology: [
      "CODE", "DATA", "MOUSE", "PIXEL", "ROBOT", "CACHE", "CLOUD", "SERVER",
      "BROWSER", "DATABASE", "NETWORK", "PROGRAM", "SOFTWARE", "TERMINAL",
      "ALGORITHM", "COMPILER", "ENCRYPTION", "HARDWARE", "KEYBOARD", "VARIABLE",
      "BYTE", "CHIP", "CABLE", "SENSOR", "PRINTER", "CIRCUIT", "MONITOR", "STORAGE", "REGISTER", "FIRMWARE",
    ],
  },
  es: {
    animals: [
      "PATO", "RANA", "GATO", "CERDO", "CABRA", "TIGRE", "PERRO", "ARAÑA",
      "DELFÍN", "CONEJO", "CABALLO", "TORTUGA", "BALLENA", "GALLINA", "CULEBRA",
      "ELEFANTE", "MARIPOSA", "CANGREJO", "PINGÜINO", "SERPIENTE",
      "OSO", "LOBO", "PULPO", "HALCÓN", "ARDILLA", "LECHUZA", "JIRAFA", "MURCIÉLAGO", "ESCARABAJO", "COCODRILO",
    ],
    countries: [
      "PERÚ", "CHILE", "CHINA", "INDIA", "JAPÓN", "MÉXICO", "CANADÁ", "ESPAÑA",
      "ITALIA", "BRASIL", "GRECIA", "SUECIA", "FRANCIA", "NORUEGA", "POLONIA",
      "ALEMANIA", "PORTUGAL", "COLOMBIA", "ARGENTINA", "TAILANDIA",
      "CUBA", "KENIA", "GHANA", "ISLANDIA", "IRLANDA", "ESTONIA", "MARRUECOS", "VIETNAM", "SENEGAL", "FINLANDIA",
    ],
    food: [
      "PAN", "PIÑA", "LIMÓN", "MANGO", "PASTA", "PIZZA", "QUESO", "TOMATE",
      "SANDÍA", "CEREZA", "MANZANA", "NARANJA", "LECHUGA", "GALLETA", "PLÁTANO",
      "BRÓCOLI", "PIMIENTO", "AGUACATE", "CHOCOLATE", "ZANAHORIA",
      "ARROZ", "PERA", "MELÓN", "NUEZ", "CALABAZA", "CIRUELA", "ESPINACA", "BERENJENA", "CANELA", "MANDARINA",
    ],
    technology: [
      "NUBE", "DATOS", "RATÓN", "PÍXEL", "ROBOT", "CÓDIGO", "ARCHIVO", "TECLADO",
      "SISTEMA", "MEMORIA", "USUARIO", "PANTALLA", "PROGRAMA", "INTERNET",
      "SERVIDOR", "SOFTWARE", "HARDWARE", "VARIABLE", "NAVEGADOR", "ALGORITMO",
      "RED", "CHIP", "CABLE", "SENSOR", "CIRCUITO", "IMPRESORA", "MONITOR", "REGISTRO", "BATERÍA", "SATÉLITE",
    ],
  },
};

function normalizeWords(words: readonly string[]): string[] {
  return [...new Set(words.map((word) => word.toUpperCase()))].filter((word) =>
    /^[A-ZÑ]+$/.test(foldWord(word)),
  );
}

function normalizeLang(source: Record<WordCategory, readonly string[]>) {
  return {
    animals: normalizeWords(source.animals),
    countries: normalizeWords(source.countries),
    food: normalizeWords(source.food),
    technology: normalizeWords(source.technology),
  };
}

export const WORDS_BY_LANG: Record<WordLang, Record<WordCategory, readonly string[]>> = {
  en: normalizeLang(SOURCE_WORDS.en),
  es: normalizeLang(SOURCE_WORDS.es),
};

export const WORD_CATEGORIES = Object.keys(WORDS_BY_LANG.en) as WordCategory[];

export function wordsForDifficulty(
  category: WordCategory,
  difficulty: WordDifficulty,
  lang: WordLang,
): string[] {
  const words = [...WORDS_BY_LANG[lang][category]];
  const filtered = words.filter((word) => {
    if (difficulty === "easy") return word.length <= 6;
    if (difficulty === "medium") return word.length >= 5 && word.length <= 8;
    return word.length >= 7;
  });
  return filtered.length > 0 ? filtered : words;
}

/** Each pool is played through once before recycling, also across the cycle boundary. */
export function drawWord(pool: readonly string[], previous: string | null, random = Math.random) {
  const history = (previous ?? "").split("|").filter(word => pool.includes(word));
  const remaining = pool.filter(word => !history.includes(word));
  const options = remaining.length ? remaining : pool.filter(word => word !== history.at(-1));
  const word = options[Math.floor(random() * options.length)] ?? pool[0];
  return { word, history: [...(remaining.length ? history : []), word].join("|") };
}
