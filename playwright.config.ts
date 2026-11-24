import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 60_000,
  use: { baseURL, locale: "es-ES", timezoneId: "Europe/Madrid", contextOptions: { reducedMotion: "reduce" } },
  webServer: {
    command: "npm run build && npm start -- --hostname 127.0.0.1 --port 4173",
    url: baseURL,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
