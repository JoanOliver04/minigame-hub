/** Draw from the visible games without repeating any until this selection is exhausted. */
export function drawCatalogueGame(ids: readonly string[], raw: string | null, random = Math.random) {
  if (!ids.length) return null;
  let seen = (raw ?? "").split(",").filter(Boolean);
  let pool = ids.filter(id => !seen.includes(id));
  if (!pool.length) {
    const previous = seen.at(-1);
    seen = seen.filter(id => !ids.includes(id));
    pool = ids.length > 1 ? ids.filter(id => id !== previous) : [...ids];
  }
  const id = pool[Math.floor(random() * pool.length)];
  return { id, history: [...seen, id].join(",") };
}
