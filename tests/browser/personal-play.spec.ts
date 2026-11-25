import { expect, test } from "@playwright/test";

test("a saved duel survives offline reopening and a simultaneous finish counts once", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.goto("/games/dice-race");
  await page.getByRole("button", { name: "Difícil", exact: true }).click();
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await page.evaluate(() => { Math.random = () => .91; });
  await page.getByRole("button", { name: "Tirar el dado" }).click();
  await expect(page.locator(".race-table strong")).toHaveText("6");
  await context.setOffline(true);
  await page.goto("/");
  const saved = page.locator(".hub-saved a");
  await expect(saved).toHaveAttribute("href", "/games/dice-race");
  await saved.click();
  await expect(page.locator(".race-table strong")).toHaveText("6");
  await expect(page.locator(".duel-save-note")).toContainText("Difícil");
  await page.getByRole("button", { name: /Cambiar ajustes/i }).click();
  await expect(page.getByRole("button", { name: "Reemplazar partida guardada" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar partida" }).click();
  await page.evaluate(() => { Math.random = () => .91; });
  for(let n = 12; n <= 30; n += 6) {
    await page.getByRole("button", { name: "Tirar el dado" }).click();
    await expect(page.locator(".race-table strong")).toHaveText(String(n));
  }
  const peer = await context.newPage();
  await peer.goto("/games/dice-race");
  const bank = (p: typeof page) => p.getByRole("button", { name: "Plantarse (+30)", exact: true });
  await expect(bank(peer)).toBeEnabled();
  await Promise.all([page, peer].map(p => bank(p).evaluate(button => (button as HTMLButtonElement).click())));
  await expect(page.locator(".duel-scores strong").first()).toHaveText("30 / 30");
  await peer.reload();
  await peer.getByRole("button", { name: "Revisar partida" }).click();
  const slider = peer.getByRole("slider", { name: "Revisar partida" });
  await expect(slider).toBeFocused();
  await expect(peer.locator(".race-table strong")).toHaveText("0");
  await slider.press("ArrowRight");
  await expect(peer.locator(".race-table strong")).toHaveText("6");
  await slider.press("End");
  await expect(peer.locator(".duel-scores strong").first()).toHaveText("30 / 30");
  await peer.goto("/");
  await expect(peer.locator(".hub-saved")).toHaveCount(0);
  await page.goto("/scores");
  await expect(page.locator(".score-totals dd").first()).toHaveText("1");
});

test("surprise uses only visible favorites, remembers the bag and returns to favorites", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  for (const id of ["exact-fifteen", "dice-race", "pirate-loot"]) {
    await page.locator(`.game-tile:has(a[href="/games/${id}"])`).locator(".favorite-star").click();
  }
  await page.goto("/favorites");
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("button", { name: "Lógica", exact: true }).click();
  const picks = [];
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Sorpréndeme" }).click();
    await expect(page).toHaveURL(/\/games\/(exact-fifteen|dice-race)$/);
    picks.push(page.url());
    await page.locator(".back-link").click();
    await expect(page).toHaveURL(/\/favorites$/);
  }
  expect(picks[0]).not.toBe(picks[1]);
  expect(picks[1]).not.toBe(picks[2]);
});

test("the library recovers a duel from IndexedDB when the local storage mirror is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error("Storage disabled"); };
  });
  await page.goto("/games/mancala");
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await page.getByRole("button", { name: /Hoyo 3, 4 semillas, cae/ }).click();
  await expect(page.locator(".sowing-store b")).toHaveText(["0", "1"]);
  await page.goto("/");
  await page.locator('.hub-saved a[href="/games/mancala"]').click();
  await expect(page.locator(".sowing-store b")).toHaveText(["0", "1"]);
  await expect(page.locator(".duel-save-note")).toContainText("Guardada en este dispositivo");
});

test("favorites sync across tabs and mobile filters keep the full catalogue reachable", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const favorites = await context.newPage();
  await favorites.goto("/favorites");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator(".game-card")).toHaveCount(37);
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("button", { name: "Lógica", exact: true }).click();
  await expect(page.locator(".game-card").first()).toContainText("Lógica");
  await page.locator(".favorite-star").first().click();
  await expect(favorites.locator(".game-card")).toHaveCount(1);
  await favorites.reload();
  await favorites.locator(".favorite-star").click();
  await expect(favorites.locator("h1")).toBeFocused();
  await expect(page.locator('.favorite-star[aria-pressed="true"]')).toHaveCount(0);
  await page.locator(".hub-clear").click();
  await expect(page.locator(".game-card")).toHaveCount(37);
});

test("the daily board resumes after reloading and a running challenge keeps its date at midnight", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-24T21:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".daily-mini-board span:not(.gap)")).toHaveCount(8);
  const initial = await page.locator(".daily-mini-board span").allTextContents();
  await page.locator(".daily-action").click();
  await expect(page.locator(".sliding-tile")).toHaveText(initial);
  const board = page.locator(".sliding-board");
  await board.focus();
  await board.press(initial.indexOf("") % 3 === 0 ? "ArrowRight" : "ArrowLeft");
  const moved = await page.locator(".sliding-tile").allTextContents();
  expect(moved).not.toEqual(initial);
  await page.reload();
  await expect(page.locator(".sliding-tile")).toHaveText(moved);
  await page.clock.fastForward(2 * 60 * 60 * 1000 + 1000);
  await expect(page.locator("time")).toHaveAttribute("datetime", "2026-11-24");
  await page.locator(".back-link").click();
  await expect(page.locator("time")).toHaveAttribute("datetime", "2026-11-25");
  await expect(page.locator(".daily-mini-board span")).not.toHaveText(initial);
});

test("simultaneous finishes retain every win and the best daily result over a legacy score", async ({ page, context }) => {
  await page.goto("/scores");
  await page.evaluate(() => localStorage.setItem("numberDuelScores", JSON.stringify({ player: 7, ai: 2 })));
  await page.reload();
  await expect(page.locator(".score-totals dd").first()).toHaveText("9");

  // Restore four independent, one-slide-from-finish attempts in the same browser profile.
  const attempts = await Promise.all([23, 25, 27, 29].map(async (moves) => {
    const tab = await context.newPage();
    await tab.addInitScript((moves) => {
      const date = new Date();
      const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
      sessionStorage.setItem("miniHubDailyRun_v1", JSON.stringify({
        day, startedAt: Date.now() - 15_000,
        game: { size: 3, tiles: [1, 2, 3, 4, 5, 6, 7, 0, 8], emptyIndex: 7, moves, solved: false },
      }));
    }, moves);
    await tab.goto("/daily");
    await expect(tab.getByRole("button", { name: "Ficha 8", exact: true })).toBeEnabled();
    return tab;
  }));
  await Promise.all(attempts.map((tab) => tab.getByRole("button", { name: "Ficha 8", exact: true }).click()));
  await expect(page.locator(".score-totals dd").first()).toHaveText("13");
  await page.reload();
  await expect(page.locator(".score-totals dd").first()).toHaveText("13");
  await page.goto("/");
  await expect(page.locator(".daily-copy p")).toContainText("24 movimientos");
});

test("a storage-restricted visit can still save a favorite and finish a puzzle", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { get() { throw new Error("Storage disabled"); } });
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error("Storage disabled"); };
  });
  await page.goto("/");
  await page.locator(".favorite-star").first().click();
  await page.locator('.hub-nav a[href="/favorites"]').click();
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page.locator('.hub-nav a[href="/"]').click();
  await page.locator('.game-card[href="/games/mancala"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await expect(page.locator(".duel-save-note")).toContainText("solo durante esta visita");
  await page.locator(".back-link").click();
  await page.locator(".daily-action").click();
  await expect(page.locator(".sliding-board")).toBeVisible();
  for (let slide = 0; slide < 31; slide++) {
    await page.getByRole("button", { name: /pista|hint/i }).click();
    await page.locator('.sliding-tile[style*="outline"]').click();
    if (await page.locator(".end-title").isVisible()) break;
  }
  await expect(page.locator(".end-title")).toBeVisible();
  await page.locator('.end-card a[href="/"]').click();
  await page.locator('.hub-nav a[href="/scores"]').click();
  await expect(page.locator(".score-totals dd").first()).toHaveText("1");
});
