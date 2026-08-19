import { defineConfig } from "@playwright/test";

/**
 * Playwright E2E config — development-only browser validation harness.
 * Tests route loads, uncaught exceptions, console errors, and responsive rendering
 * at two viewports: desktop (1440x1100) and mobile (390x844).
 *
 * Requires a running dev server (E2E_BASE_URL) and Playwright browser binaries.
 * If browsers cannot be installed, report COULD NOT VERIFY — do not claim PASS.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    timeout: 15000,
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