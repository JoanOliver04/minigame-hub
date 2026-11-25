import { expect, test, type Page } from "@playwright/test";

const start = (page: Page) => page.locator("main section.card button.btn.primary").last().click();

test("word replay rotates the pool and incompatible guesses leave the budget untouched", async ({ page }) => {
  await page.goto("/games/word-guess");
  await page.locator("header").getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("main .seg").last().locator("[aria-pressed=true]")).toHaveText("English");
  await page.locator("header").getByRole("button", { name: "ES", exact: true }).click();
  await expect(page.locator("main .seg").last().locator("[aria-pressed=true]")).toHaveText("Castellano");
  await page.evaluate(() => { Math.random = () => 0; });
  await start(page);
  const guess = page.locator(".word-form input");
  await guess.fill("A");
  await guess.press("Enter");
  await expect(page.locator("#word-input-feedback")).toContainText("Conservas el turno");
  await expect(page.locator(".word-budget-head strong")).toHaveText("0 / 8");
  await page.locator(".word-keyboard").getByRole("button", { name: "C", exact: true }).click();
  await expect(page.locator(".word-tiles .revealed").first()).toHaveText("C");
  await guess.fill("PERRO");
  await guess.press("Enter");
  await expect(page.locator("#word-input-feedback")).toContainText("casillas descubiertas");
  await expect(page.locator(".word-budget-head strong")).toHaveText("0 / 8");
  await guess.fill("CERDO");
  await guess.press("Enter");
  await expect(page.locator(".end-title")).toBeVisible();
  await page.locator(".end-card button.primary").click();
  await guess.fill("CABRA");
  await guess.press("Enter");
  await expect(page.locator(".end-title")).toBeVisible();
});

test("library and favorite filters survive a game visit, and sound follows the player across tabs", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.getByRole("searchbox").fill("beat-reactor");
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("button", { name: "Acción", exact: true }).click();
  await page.locator(".hub-online input").check();
  await page.locator(".favorite-star").click();
  await page.locator(".game-card").click();
  await page.locator(".back-link").click();
  await expect(page.getByRole("searchbox")).toHaveValue("beat-reactor");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".hub-online input")).toBeChecked();
  await expect(page.getByText("Acción", { exact: true }).filter({ visible: true }).last()).toBeVisible();
  await page.locator(".hub-nav a[href='/favorites']").click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await page.getByRole("searchbox").fill("reactor");
  await page.locator(".game-card").click();
  await page.locator(".back-link").click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByRole("searchbox")).toHaveValue("reactor");
  const sound = page.locator(".hub-sound");
  const other = await context.newPage();
  await other.goto("/games/guess");
  await sound.click();
  await expect(other.locator(".hub-sound")).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await other.locator(".hub-sound").click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
});

test("reaction time keeps slower taps, discards an interrupted signal, and records one match", async ({ page, context }) => {
  const scores = await context.newPage();
  await scores.goto("/scores");
  await page.bringToFront();
  await page.goto("/games/reaction-time");
  await page.getByRole("button", { name: "Primero a 3" }).click();
  await page.clock.install();
  await page.evaluate(() => { Math.random = () => 0.5; });
  await start(page);
  const target = page.locator(".rt-box");
  await expect(target).toBeFocused();
  await page.clock.runFor(750);
  await expect(target).toHaveClass(/ready/);
  // Simulate an OS visibility notification between arming the timer and the green signal.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const resume = page.getByRole("button", { name: "Continuar partida" });
  await expect(resume).toBeVisible();
  await page.clock.fastForward(15000);
  await page.evaluate(() => { Reflect.deleteProperty(document, "hidden"); });
  await resume.click();
  await expect(page.locator(".log li")).toHaveCount(0);
  // At random=0.5 the signal arrives after 700 ms of grace and a 3250 ms wait.
  await page.clock.runFor(4500);
  await expect(target).toHaveClass(/go/);
  await target.press("Space");
  await expect(target).toHaveClass(/resolved ai/);
  await expect(page.locator(".rt-box-times")).toContainText(/Tú: \d+\s*ms/);
  await expect(scores.locator(".score-totals dd").first()).toHaveText("0");
  for (let i = 0; i < 2; i++) {
    await page.clock.runFor(3000);
    await expect(target).toHaveClass(/ready/);
    await target.press("Enter");
    await expect(target).toHaveClass(/resolved ai/);
  }
  await page.clock.runFor(2400);
  await expect(page.locator(".end-title")).toBeVisible();
  await scores.reload();
  await expect(scores.locator(".score-totals dd").first()).toHaveText("1");
});

test("rhythm practice pauses the clock and replays the same track and opponent from the start", async ({ page }) => {
  await page.goto("/games/beat-reactor");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "130", exact: true }).click();
  await page.clock.install();
  await start(page);
  const progress = page.locator(".reactor-progress");
  const duration = await progress.getAttribute("max");
  await page.clock.runFor(750);
  await page.getByRole("button", { name: "Pausar partida" }).click();
  const stopped = await progress.getAttribute("value");
  await page.clock.fastForward(45000);
  await expect(progress).toHaveAttribute("value", stopped!);
  await expect(page.locator(".reactor-pad").first()).toBeDisabled();
  await page.getByRole("button", { name: "Continuar partida" }).click();
  await page.clock.fastForward(38000);
  await page.clock.runFor(1800);
  const result = await page.locator(".end-number").innerText();
  await page.getByRole("button", { name: "Repetir esta pista" }).click();
  await expect(progress).toHaveAttribute("max", duration!);
  expect(Number(await progress.getAttribute("value"))).toBeLessThan(1);
  await page.clock.fastForward(38000);
  await page.clock.runFor(1800);
  await expect(page.locator(".end-number")).toHaveText(result);
});

test("a note played on the visible judgement line scores over a scheduled backing beat", async ({ page }) => {
  await page.addInitScript(() => {
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const startTone = oscillator.start.bind(oscillator);
      oscillator.start = (at = 0) => {
        if (at > this.currentTime + 0.01) document.documentElement.dataset.rhythmScheduled = "yes";
        startTone(at);
      };
      return oscillator;
    };
  });
  await page.goto("/games/beat-reactor");
  await page.getByRole("button", { name: "130", exact: true }).click();
  await page.locator("main .seg").nth(2).getByRole("button").first().click();
  await start(page);
  await expect(page.locator("html")).toHaveAttribute("data-rhythm-scheduled", "yes");
  await page.evaluate(() => {
    function play() {
      for (const [lane, track] of Array.from(document.querySelectorAll(".reactor-lane-track")).entries()) {
        const line = track.getBoundingClientRect().top + track.clientTop + parseFloat(getComputedStyle(track, "::after").top);
        for (const note of track.querySelectorAll(".reactor-note")) {
          const rect = note.getBoundingClientRect();
          if (Math.abs(rect.top + rect.height / 2 - line) > 1.5) continue;
          window.dispatchEvent(new KeyboardEvent("keydown", { key: ["d", "f", "j", "k"][lane] }));
          return;
        }
      }
      requestAnimationFrame(play);
    }
    requestAnimationFrame(play);
  });
  // The score survives later auto-misses; the brief judgement flash can be replaced on the next note.
  await expect(page.locator(".reactor-hud .you")).toHaveText(/\b(700|1000)$/, { timeout: 20000 });
  await page.getByRole("button", { name: "Repetir esta pista" }).click({ timeout: 25000 });
  const progress = page.locator(".reactor-progress");
  await expect.poll(async () => Number(await progress.getAttribute("value"))).toBeGreaterThan(0.05);
  expect(Number(await progress.getAttribute("value"))).toBeLessThan(2);
});
