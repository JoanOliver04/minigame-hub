import { expect, test } from "@playwright/test";

test("a laptop shows the entire six-by-six board and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const solo of [false, true]) {
    await page.goto("/games/memory-match");
    if (solo) await page.getByRole("button", { name: "Tablero en solitario" }).click();
    await page.getByRole("button", { name: /6\s*×\s*6/ }).click();
    await page.locator("main section button.btn.primary").last().click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const board = page.locator(".memory-board");
    await expect(board.locator("button")).toHaveCount(36);
    const fits = await board.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    expect(fits).toBe(true);
    await expect(board.locator(".memory-tile-inner").first()).toHaveCSS("transition-duration", "0s");
  }
});

test("a solo memory miss keeps the turn and a finished board saves its own record", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/games/memory-match");
  await page.getByRole("button", { name: "Tablero en solitario" }).click();
  await page.getByRole("button", { name: /Tablero rápido/ }).click();
  await page.locator("main section button.btn.primary").last().click();
  const tiles = page.locator(".memory-tile");
  const symbols = await tiles.locator(".memory-tile-front").allTextContents();
  const different = symbols.findIndex(s => s !== symbols[0]);
  await tiles.first().click();
  await tiles.nth(different).click();
  await expect(tiles.first()).toBeEnabled();
  await expect(page.locator(".memory-solo-tally")).toContainText("0 de 6 parejas");
  for (const symbol of new Set(symbols)) {
    const first = symbols.indexOf(symbol);
    const second = symbols.lastIndexOf(symbol);
    await tiles.nth(first).click();
    await tiles.nth(second).click();
  }
  await expect(page.locator(".end-title")).toHaveText("¡Encontraste todas las parejas!");
  await expect(page.locator(".end-stats .stat-box").last()).toContainText("7");
  await page.reload();
  await page.getByRole("button", { name: "Tablero en solitario" }).click();
  await expect(page.locator(".arcade-readout")).toHaveCount(0);
  await page.getByRole("button", { name: /Tablero rápido/ }).click();
  await expect(page.locator(".arcade-readout")).toContainText("7");
  await page.goto("/scores");
  await expect(page.locator(".score-totals dd").first()).toHaveText("0");
});

test("a driven time trial becomes a replayable ghost only on its own circuit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/neon-drift");
  await page.getByRole("button", { name: "Contrarreloj" }).click();
  const start = page.locator("main section button.btn.primary").last();
  await start.click();
  await expect(page.locator(".drift-car.ai, .drift-car.ghost")).toHaveCount(0);
  await page.getByRole("button", { name: "Pausar carrera" }).click();
  await expect(page.locator("[data-drift-action=left]")).toBeDisabled();
  await page.getByRole("button", { name: "Continuar carrera" }).click();
  // Steer using the visible car and next checkpoint, through the game's keyboard controls.
  await page.evaluate(() => {
    let held = "";
    let previousHeading = 0;
    let previousTime = 0;
    function steer(key: string) {
      if (key === held) return;
      if (held) window.dispatchEvent(new KeyboardEvent("keyup", { key: held }));
      if (key) window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      held = key;
    }
    function drive(now: number) {
      const car = document.querySelector<SVGGElement>(".drift-car.player");
      const gate = document.querySelector<SVGCircleElement>(".drift-checkpoint.next");
      if (!car || !gate) { steer(""); return; }
      if (!document.querySelector(".drift-countdown") && now - previousTime >= 28) {
        const [translate, rotate] = Array.from(car.transform.baseVal);
        const desired = Math.atan2(gate.cy.baseVal.value - translate.matrix.f, gate.cx.baseVal.value - translate.matrix.e);
        const heading = rotate.angle * Math.PI / 180;
        const error = desired - heading;
        const velocity = (heading - previousHeading) * 1000 / (now - previousTime);
        const correction = Math.atan2(Math.sin(error), Math.cos(error)) - velocity * 0.11;
        steer(Math.abs(correction) < 0.07 ? "" : correction > 0 ? "ArrowRight" : "ArrowLeft");
        previousHeading = heading;
        previousTime = now;
      }
      requestAnimationFrame(drive);
    }
    requestAnimationFrame(drive);
  });
  await expect(page.locator(".end-title")).toHaveText("¡Vuelta completada!", { timeout: 35_000 });
  const lap = await page.locator(".end-number").innerText();
  await page.locator(".end-card .btn.primary").click();
  await expect(page.locator(".drift-car.ghost")).toHaveCount(1);
  await expect(page.locator(".arcade-caption")).toContainText(lap);
  await page.reload();
  await page.getByRole("button", { name: "Contrarreloj" }).click();
  await expect(page.locator(".arcade-readout")).toContainText(lap);
  await page.getByRole("button", { name: "Serpiente", exact: true }).click();
  await expect(page.locator(".arcade-readout")).toHaveCount(0);
  await page.goto("/scores");
  await expect(page.locator(".score-totals dd").first()).toHaveText("0");
});
