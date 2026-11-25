import { expect, test } from "@playwright/test";

test("a returning player can find their last room until its expiry", async ({ page }) => {
  await page.clock.install();
  await page.goto("/rooms");
  const room = { code: "K7RXPQ", gameId: "connect-four", expiresAt: await page.evaluate(() => Date.now() + 60_000) };
  await page.evaluate(saved => localStorage.setItem("miniHubRecentRoom", JSON.stringify(saved)), room);
  await page.reload();
  const resume = page.locator("main").getByRole("link", { name: /Volver a tu sala/ });
  await expect(resume).toHaveAttribute("href", "/rooms/K7RXPQ");
  await page.locator("header .friends-link").click();
  await expect(page.locator("header").getByRole("link", { name: /Volver a tu sala/ })).toHaveText(/Cuatro en Raya/i);
  await page.clock.fastForward(61_000);
  await expect(resume).toHaveCount(0);
  await expect(page.locator("header").getByRole("link", { name: /Volver a tu sala/ })).toHaveCount(0);
});

test("the friends button opens both paths and accepts a pasted invitation without truncating it", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/games/pocket-curling");
  const friends = page.locator("header .friends-link");
  await friends.click();
  await expect(friends).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#friends-options a").first()).toHaveAttribute("href", "/rooms?game=pocket-curling");
  await page.keyboard.press("Escape");
  await expect(friends).toBeFocused();
  await friends.click();
  await page.getByRole("link", { name: "Usar una invitación" }).click();
  await page.locator("#room-player-name").fill("Invitado");
  const field = page.getByLabel("Código de sala o enlace de invitación");
  await field.fill("invitación incompleta");
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("alert").filter({ hasText: "seis caracteres" })).toBeVisible();
  const link = new URL("/rooms/k7rxpq?via=chat", page.url()).href;
  await page.route(/https:\/\/(?:firestore|identitytoolkit)\.googleapis\.com\//, route => route.abort());
  await field.fill(link);
  await expect(field).toHaveValue(link);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/rooms\/K7RXPQ$/);
});

test("curling and exact fifteen play through against AI and record one finish each", async ({ page }) => {
  test.setTimeout(90_000);
  for (const [id, control] of [["pocket-curling", ".curl-throw"], ["exact-fifteen", ".fifteen-number"]]) {
    await page.goto("/games/" + id);
    await page.getByRole("button", { name: "Jugar contra la IA" }).click();
    if (id === "pocket-curling") {
      await page.locator(".curl-controls select").selectOption("1");
      await page.locator(".curl-controls input").first().press("ArrowLeft");
    }
    const next = page.locator(control + ":enabled").first();
    const replay = page.getByRole("button", { name: "Jugar de nuevo" });
    for (let i = 0; i < 12; i++) {
      await expect(next.or(replay).first()).toBeVisible();
      if (await replay.isVisible()) break;
      await next.click();
    }
    if (id === "pocket-curling") {
      await page.getByRole("button", { name: "Revisar partida" }).click();
      const timeline = page.getByRole("slider", { name: "Revisar partida" });
      for (let shot = 0; shot < 4; shot++) await timeline.press("ArrowRight");
      await expect(page.locator(".curl-round")).toHaveText("Manga 1/3 · Piedra 4/4");
      await expect(page.locator(".curl-rink .curl-stone").first()).toBeVisible();
      await expect(page.locator(".curl-controls")).toHaveCount(0);
    }
    await replay.click();
    await expect(next).toBeEnabled();
  }
  await page.goto("/scores");
  await expect(page.locator(".score-totals dd").first()).toHaveText("2");
});

test("the catalogue and favorites offer game-specific friend rooms alongside solo play", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.locator("header .friends-link")).toHaveAccessibleDescription("Invitar o unirse");
  const tile = page.locator(".game-tile").filter({ has: page.locator('a[href="/games/pirate-loot"]') });
  await tile.locator(".favorite-star").click();
  await tile.getByRole("link", { name: "Jugar con un amigo · Botín pirata" }).click();
  await expect(page.locator("#room-game")).toHaveValue("pirate-loot");
  await page.goto("/favorites");
  await expect(page.locator(".game-friend-action")).toHaveAttribute("href", "/rooms?game=pirate-loot");
  await page.goto("/");
  await expect(page.locator(".game-friend-action")).toHaveCount(36);
  await expect(page.locator('.game-tile:has([href="/games/sliding-puzzle"]) .game-friend-action')).toHaveCount(0);
});

test("penguins and pirates respond to the player and complete replayable solo games", async ({ page }) => {
  test.setTimeout(90_000);
  for (const [id, control] of [["ice-floe", ".ice-tile"], ["pirate-loot", ".loot-card"]]) {
    await page.goto("/games/" + id);
    await page.getByRole("button", { name: "Jugar contra la IA" }).click();
    const replay = page.getByRole("button", { name: "Jugar de nuevo" });
    const action = page.locator(control + ":enabled").first();
    for (let turn = 0; turn < 14; turn++) {
      await expect(action.or(replay).first()).toBeVisible();
      if (await replay.isVisible()) break;
      await action.click();
    }
    await replay.click();
    await expect(action).toBeEnabled();
    if (id === "pirate-loot") await expect(page.locator('.loot-card[data-taken="true"]')).toHaveCount(0);
    else await expect(page.locator('.ice-tile[data-water="true"]')).toHaveCount(2);
  }
  await page.goto("/scores");
  await expect(page.locator(".score-totals dd").first()).toHaveText("2");
});

test("the friends link keeps its full name on mobile and a game invitation preselects the right room", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Jugar con amigos", exact: true }).click();
  await page.locator("header").getByRole("link", { name: "Invitar a un amigo" }).click();
  await expect(page.getByRole("heading", { name: "Jugar con amigos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unirse a una sala" })).toBeVisible();
  const defaultGame = await page.getByLabel("Juego", { exact: true }).inputValue();
  for (const id of ["mini-reversi", "dice-race", "dots-boxes", "mancala", "ice-floe", "pirate-loot", "pocket-curling", "exact-fifteen"]) {
    await page.goto("/games/" + id);
    await expect(page.getByRole("button", { name: "Jugar contra la IA" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Jugar con amigos" }).click();
    await expect(page.getByLabel("Juego", { exact: true })).toHaveValue(id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await page.goto("/rooms?game=sliding-puzzle");
  await expect(page.getByLabel("Juego", { exact: true })).toHaveValue(defaultGame);
});

test("friends can open the code form from home or invite from an existing game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("link", { name: "Tengo un código" }).click();
  await expect(page.locator("#join-room-code")).toBeVisible();
  await page.goBack();
  await page.getByRole("link", { name: "Invitar a un amigo" }).click();
  await expect(page.locator("#room-game")).toBeVisible();
  await page.goto("/games/connect-four");
  await page.locator("header").getByRole("button", { name: "Jugar con amigos" }).click();
  await page.locator("header").getByRole("link", { name: "Invitar a un amigo" }).click();
  await expect(page.locator("#room-game")).toHaveValue("connect-four");
});

test("a seed landing in the store grants a second move and the boxes opponent draws a reply", async ({ page }) => {
  await page.goto("/games/mancala");
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await page.getByRole("button", { name: /Hoyo 3, 4 semillas, cae/ }).click();
  await expect(page.locator(".sowing-store b")).toHaveText(["0", "1"]);
  await expect(page.locator(".duel-note")).toContainText("Turno extra");
  await expect(page.locator(".sowing-pit:enabled")).toHaveCount(5);
  await page.goto("/games/dots-boxes");
  await page.getByRole("button", { name: "Jugar contra la IA" }).click();
  await page.getByRole("button", { name: "Línea A1–B1" }).press("Enter");
  await expect(page.locator('.boxes-edge[data-drawn="true"]')).toHaveCount(2);
  await expect(page.locator(".boxes-edge:enabled")).toHaveCount(22);
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
