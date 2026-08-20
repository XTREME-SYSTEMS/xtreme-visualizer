import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /review\.capture\.ts$/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: ".validation/review-playwright.json" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    timeout: 30000,
    serviceWorkers: "block",
  },
  webServer: {
    command: "npx vite",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 1100 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
});
