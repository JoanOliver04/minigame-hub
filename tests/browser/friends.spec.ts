import { expect, test } from "@playwright/test";

test("the friends link keeps its full name on mobile and a game invitation preselects the right room", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("link", { name: "Jugar con amigos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Jugar con amigos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unirse a una sala" })).toBeVisible();
  const defaultGame = await page.getByLabel("Juego", { exact: true }).inputValue();
  for (const id of ["mini-reversi", "dice-race"]) {
    await page.goto("/games/" + id);
    await expect(page.getByRole("button", { name: "Jugar contra la IA" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Jugar con amigos" }).click();
    await expect(page.getByLabel("Juego", { exact: true })).toHaveValue(id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await page.goto("/rooms?game=sliding-puzzle");
  await expect(page.getByLabel("Juego", { exact: true })).toHaveValue(defaultGame);
});

test("the solo AI responds to a capture and plays its own dice turn", async ({ page }) => {
  await page.goto("/games/mini-reversi");
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await expect(page.locator(".reversi-disc")).toHaveCount(4);
  await page.locator(".reversi-cell:enabled").first().click();
  await expect(page.locator(".reversi-disc")).toHaveCount(6);
  await page.goto("/games/dice-race");
  await page.evaluate(() => { Math.random = () => 0.9; });
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await page.getByRole("button", { name: "Tirar el dado" }).click();
  await page.getByRole("button", { name: /Plantarse/ }).click();
  await expect(page.locator(".duel-scores strong")).toHaveText(["6 / 30", "12 / 30"]);
  await expect(page.getByRole("button", { name: "Tirar el dado" })).toBeEnabled();
});

test("each new solo game can finish, replay and add one result to the scoreboard", async ({ page }) => {
  await page.goto("/games/mini-reversi");
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  const replay = page.getByRole("button", { name: "Jugar de nuevo" });
  for (let i = 0; i < 32; i++) {
    const square = page.locator(".reversi-cell:enabled").first();
    await expect(square.or(replay).first()).toBeVisible();
    if (await replay.isVisible()) break;
    await square.click();
  }
  await replay.click();
  await expect(page.locator(".reversi-disc")).toHaveCount(4);
  await page.goto("/games/dice-race");
  await page.evaluate(() => { Math.random = () => .9; });
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Tirar el dado" }).click();
  await page.getByRole("button", { name: /Plantarse/ }).click();
  await expect(page.locator(".duel-scores strong")).toHaveText(["30 / 30", "0 / 30"]);
  await replay.click();
  await expect(page.locator(".duel-scores strong")).toHaveText(["0 / 30", "0 / 30"]);
  await page.goto("/scores");
  await expect(page.locator(".score-totals dd").first()).toHaveText("2");
});
