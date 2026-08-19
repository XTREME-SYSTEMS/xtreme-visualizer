import { defineConfig } from "@playwright/test";

/**
 * Playwright E2E config — deterministic browser validation harness.
 *
 * webServer lifecycle: auto-starts Vite, waits for health, shuts down reliably.
 * No stale server dependence — reproducible from: fresh checkout → npm ci → playwright test.
 *
 * Visual baselines: e2e/visual.spec.ts-snapshots/ (project-prefixed, committed).
 * Transient artifacts (test-results/, e2e/screenshots/) are gitignored.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5179",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    timeout: 30000,
  },
  webServer: {
    command: "npm run dev -- --port 5179 --strictPort",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [
    {
      name: "desktop-1440",
      use: { viewport: { width: 1440, height: 1100 } },
    },
    {
      name: "mobile-390",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});