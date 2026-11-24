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
  await expect(page.getByRole("heading", { name: "Sin conexión" })).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.locator(".game-card")).toHaveCount(29);
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
