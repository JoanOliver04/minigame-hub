import { expect, test } from "@playwright/test";

test("installed identity, icons and offline recovery work on the production build", async ({ page, context }) => {
  await page.goto("/");
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send("Page.getAppManifest");
  expect(manifest.errors).toEqual([]);
  const app = JSON.parse(manifest.data!);
  expect(app).toMatchObject({ id: "/", start_url: "/", scope: "/", display: "standalone", name: "Mini-Game Hub" });
  for (const icon of app.icons) {
    const size = await page.evaluate(async (src: string) => {
      const bitmap = await createImageBitmap(await (await fetch(src)).blob());
      return bitmap.width + "x" + bitmap.height;
    }, icon.src);
    expect(size).toBe(icon.sizes);
  }
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  expect((await cdp.send("Page.getInstallabilityErrors")).installabilityErrors).toEqual([]);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".game-card")).toHaveCount(37);
  await expect(page.getByText("Sin conexión · Juego en solitario")).toBeVisible();
  await page.locator('.game-card[href="/games/ttt"]').click();
  await expect(page.locator(".htp-btn")).toBeVisible();
  await page.locator("main section.card button.btn.primary").last().click();
  await page.locator(".ttt-cell:enabled").first().click();
  await expect(page.locator(".ttt-cell").first()).not.toBeEmpty();
  await page.goto("/rooms/ABCDEF");
  await expect(page.getByRole("heading", { name: "Sin conexión" })).toBeVisible();
  await page.getByRole("link", { name: "Abrir la biblioteca de juegos" }).click();
  await expect(page.locator(".game-card")).toHaveCount(37);
  await page.goto("/rooms");
  await context.setOffline(false);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page).toHaveURL(/\/rooms$/);
  await expect(page.getByText("Sin conexión · Juego en solitario")).toHaveCount(0);
});

test("install uses a deferred browser prompt and hides the control after installation", async ({ page }) => {
  await page.goto("/");
  const install = page.getByRole("button", { name: "Instalar", exact: true });
  await expect(install).toBeVisible();
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => window.dispatchEvent(new Event("appinstalled")),
    });
    window.dispatchEvent(event);
  });
  await install.click();
  await expect(install).toHaveCount(0);
});

test("a resumed puzzle keeps its play time and records one win offline", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.evaluate(() => localStorage.setItem("miniHubFreePuzzle_v1", JSON.stringify({
    game: { size: 3, tiles: [1, 2, 3, 4, 5, 6, 7, 0, 8], emptyIndex: 7, moves: 12, solved: false },
    elapsedMs: 83_000, undoIndex: null,
  })));
  // Simulate leaving before the browser opens its scoring database. The next document can open it normally.
  await page.addInitScript(() => {
    if (location.pathname === "/games/sliding-puzzle") {
      Object.defineProperty(window, "indexedDB", { value: { open: () => new EventTarget() } });
    }
  });
  await context.setOffline(true);
  await page.goto("/games/sliding-puzzle");
  await expect(page.locator(".puzzle-resume")).toContainText("1:23");
  await page.getByRole("button", { name: "Continuar puzle" }).click();
  await page.getByRole("button", { name: "Ficha 8", exact: true }).click();
  await expect(page.locator(".end-number")).toContainText("13 movimientos");
  const second = await context.newPage();
  await Promise.all([page.goto("/scores"), second.goto("/scores")]);
  await expect(page.locator(".score-totals dd").first()).toHaveText("1");
  await expect(second.locator(".score-totals dd").first()).toHaveText("1");
  await page.reload();
  await expect(page.locator(".score-totals dd").first()).toHaveText("1");
  await page.goto("/games/sliding-puzzle");
  await expect(page.getByRole("button", { name: "Continuar puzle" })).toHaveCount(0);
});
