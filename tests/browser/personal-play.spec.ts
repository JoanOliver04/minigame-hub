import { expect, test } from "@playwright/test";

test("favorites sync across tabs and mobile filters keep the full catalogue reachable", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const favorites = await context.newPage();
  await favorites.goto("/favorites");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator(".game-card")).toHaveCount(31);
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
  await expect(page.locator(".game-card")).toHaveCount(31);
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
