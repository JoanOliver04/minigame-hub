import { expect, test, type Page } from "@playwright/test";
import { createRng } from "../../src/lib/rng";
import { aiPickSecret } from "../../src/games/signal-breaker/ai";

async function start(page: Page, slug: string) {
  await page.goto(`/games/${slug}`);
  const setup = page.locator("main section.card").first();
  if (slug === "fleet-command") await setup.getByRole("button", { name: /aleatorio/i }).click();
  await setup.locator("button.btn.primary").last().click();
}

// Each route is exercised through a real game control on a narrow viewport.
const controls: Record<string, string> = {
  guess: ".arcade-tool", rps: ".rps-choice", ttt: ".ttt-cell:enabled",
  "higher-or-lower": ".hol-choice:enabled", "connect-four": ".connect-column:enabled",
  "memory-match": ".memory-tile:enabled", nim: ".nim-token:enabled",
  "word-guess": ".word-keyboard button:enabled", blackjack: ".bj-actions button:enabled",
  "prism-clash": ".prism-hand button:enabled, .prism-deck:enabled",
  "property-baron": ".property-screen button.primary:enabled", parchis: ".parchis-roll:enabled",
  "goose-game": ".goose-controls button:enabled", "tile-rummy": ".tile-rummy-actions button:enabled",
  domino: ".domino-rack button:enabled, .domino-actions button:enabled",
  "sliding-puzzle": ".sliding-tile.movable", "reaction-time": ".rt-box.ready, .rt-box.go",
  "penalty-kick": ".penalty-shoot", "basket-shot": ".basket-shoot",
  "shadow-protocol": ".shadow-tile.reachable", "fleet-command": ".fleet-board.enemy button:enabled",
  "windline-archery": ".archery-controls button", "beat-reactor": ".reactor-pad",
  "circuit-breaker": ".breaker-pad", "neon-drift": "[data-drift-action=left]",
  "signal-breaker": ".sig-palette button", "diceforge-arena": ".forge-locks button",
  "hex-dominion": ".hex-cell.empty", spellstorm: ".storm-word-card input",
};

async function playOne(page: Page, slug: string, control: string) {
  await start(page, slug);
  const action = page.locator(control).first();
  if (slug === "spellstorm") {
    const word = await page.locator(".storm-word-card strong").first().innerText();
    await action.fill(word);
  } else {
    await action.click();
  }
}

for (const [slug, control] of Object.entries(controls)) {
  test(`mobile solo game · ${slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await playOne(page, slug, control);
    await expect(page.locator("main section.card").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect(errors).toEqual([]);
  });
}

test("all 29 games can be opened and played offline after a single library visit", async ({ context, page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const slugs = await page.locator(".game-card").evaluateAll(cards => cards.map(card => card.getAttribute("href")!.split("/").pop()));
  expect(slugs.sort()).toEqual(Object.keys(controls).sort());
  await context.setOffline(true);
  const cold = await context.newPage();
  await page.close();
  const errors: string[] = [];
  cold.on("pageerror", e => errors.push(e.message));
  for (const [slug, control] of Object.entries(controls)) {
    await test.step(slug, () => playOne(cold, slug, control));
  }
  await cold.goto("/favorites");
  await expect(cold.locator(".app-header")).toBeVisible();
  await cold.goto("/scores");
  await cold.getByRole("checkbox").check();
  await expect(cold.locator(".stats-table tbody tr:not(.overall)")).toHaveCount(29);
  await cold.goto("/daily");
  await cold.locator(".sliding-tile.movable").first().click();
  await expect(cold.locator(".sliding-hud span").first()).toHaveText("1");
  expect(errors).toEqual([]);
});

test("quick memory has six pairs and no-repeat RPS locks the last hand", async ({ page }) => {
  await page.goto("/games/memory-match");
  await page.getByRole("button", { name: /Tablero rápido/ }).click();
  await page.locator("main section.card button.btn.primary").last().click();
  await expect(page.locator(".memory-tile")).toHaveCount(12);
  await page.locator(".memory-tile").first().click();
  await expect(page.locator(".memory-tile.flipped")).toHaveCount(1);
  await page.goto("/games/rps");
  await page.getByRole("checkbox").check();
  await page.locator("main section.card button.btn.primary").last().click();
  await page.locator(".rps-choice").first().click();
  await expect(page.locator(".rps-choice").nth(1)).toBeEnabled();
  await expect(page.locator(".rps-choice").first()).toBeDisabled();
  await page.locator(".arcade-insight summary").click();
  await expect(page.locator(".throw-strip li")).toHaveCount(1);
});

test("free puzzle resumes the board and its undo after reopening", async ({ page }) => {
  await start(page, "sliding-puzzle");
  const before = await page.locator(".sliding-tile").allTextContents();
  await page.locator(".sliding-tile.movable").first().click();
  const after = await page.locator(".sliding-tile").allTextContents();
  await page.goto("/daily");
  await page.locator(".sliding-tile.movable").first().click();
  await page.goto("/games/sliding-puzzle");
  await expect(page.locator(".puzzle-resume")).toContainText("4 × 4");
  await page.getByRole("button", { name: "Continuar puzle" }).click();
  await expect(page.locator(".sliding-tile")).toHaveText(after);
  await expect(page.locator(".sliding-hud span").first()).toHaveText("1");
  await page.getByRole("button", { name: /Deshacer/ }).click();
  await expect(page.locator(".sliding-tile")).toHaveText(before);
  await expect(page.getByRole("button", { name: /Deshacer/ })).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Continuar puzle" }).click();
  await expect(page.getByRole("button", { name: /Deshacer/ })).toBeDisabled();
  await expect(page.locator(".sliding-hud span").first()).toHaveText("0");
});

test("fleet placement previews and undoes one ship", async ({ page }) => {
  await page.goto("/games/fleet-command");
  const origin = page.locator(".fleet-cell").first();
  await origin.focus();
  await expect(page.locator(".position-valid")).toHaveCount(4);
  await origin.press("Enter");
  await expect(page.locator(".fleet-cell.ship")).toHaveCount(4);
  await page.getByRole("button", { name: "Retirar último barco" }).click();
  await expect(page.locator(".fleet-cell.ship")).toHaveCount(0);
});

test("Signal lets you edit an earlier code without spending a turn on a duplicate", async ({ page }) => {
  await page.goto("/games/signal-breaker");
  await page.evaluate(() => { Math.random = () => 0.25; });
  await page.getByText("Permitir símbolos repetidos", { exact: true }).click();
  await page.locator("main section.card button.btn.primary").last().click();
  // With a distinct-symbol secret, an all-identical guess cannot solve it.
  const count = await page.locator(".sig-slot").count();
  for (let i = 0; i < count; i++) await page.locator(".sig-palette button").first().click();
  const submit = page.locator(".sig-input .btn.primary");
  await submit.click();
  await page.getByRole("button", { name: "Usar este intento 1" }).click();
  await expect(submit).toBeDisabled();
  await expect(page.locator(".sig-input [role=status]")).toHaveText("Ya has probado este código.");
  await page.locator(".sig-slot").first().click();
  await expect(submit).toBeEnabled();
  await expect(page.locator(".sig-recall")).toHaveCount(1);
});

test("cracking Signal on the first guess always reaches the end screen after the AI reply", async ({ page }) => {
  await page.goto("/games/signal-breaker");
  await page.evaluate(() => { Math.random = () => 0.125; });
  await page.locator("main section.card button.btn.primary").last().click();
  const secret = aiPickSecret([], "medium", true, createRng(0x20000000));
  for (const symbol of secret) await page.locator(".sig-palette button").nth(symbol).click();
  await page.locator(".sig-input .btn.primary").click();
  await expect(page.locator(".signal-screen.end-card")).toBeVisible();
  await expect(page.locator(".end-stats .player .value")).toHaveText("1");
});

test("a basket release is registered while the pointer is still held", async ({ page }) => {
  await start(page, "basket-shot");
  const shot = page.locator(".basket-shoot");
  const box = await shot.boundingBox();
  if (!box) throw new Error("Missing shoot button");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(shot).toBeDisabled();
  await expect(page.locator(".basket-release-ghost")).toBeVisible();
  await page.mouse.up();
  await expect(shot).toBeEnabled();
  await expect(page.locator(".basket-release-ghost")).toHaveCount(1);
});

test("the forge shop previews an affordable face and applies it to the chosen die", async ({ page }) => {
  await start(page, "diceforge-arena");
  for (let round = 0; round < 3; round++) {
    await page.locator(".forge-locks button").first().click();
    if (await page.locator(".forge-offer:enabled").count()) break;
    await page.getByRole("button", { name: "Ahorrar monedas" }).click();
  }
  await page.locator(".forge-offer:enabled").first().click();
  await expect(page.locator(".forge-workbench button")).toHaveCount(18);
  await expect(page.locator(".forge-workbench")).toContainText("Saldo restante");
  await page.locator(".forge-workbench button").first().click();
  await expect(page.locator(".forge-locks button")).toHaveCount(3);
});

test("Hex retains a connected winning trace on the final board and clears it on replay", async ({ page }) => {
  await start(page, "hex-dominion");
  for (let i = 0; i < 25; i++) {
    await expect(page.locator(".hex-cell[aria-disabled=false], .hex-path").first()).toBeVisible();
    if (await page.locator(".hex-path").count()) break;
    await page.locator(".hex-cell[aria-disabled=false]").first().click();
  }
  await expect(page.locator(".hex-path")).toBeVisible();
  await expect(page.locator(".hex-cell")).toHaveCount(49);
  await page.locator(".end-card .btn.primary").click();
  await expect(page.locator(".hex-cell.empty")).toHaveCount(49);
});
