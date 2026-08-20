import { test, expect } from "@playwright/test";
import { setupBase44Mocks } from "./fixtures/mock-api";

/**
 * Visual / route certification — deterministic E2E with Base44 API mocks.
 *
 * For each route at each viewport (desktop 1440×1100, mobile 390×844):
 * 1. Verifies HTTP/page load, body render, no uncaught JS errors, no unexpected console errors
 * 2. Captures a visual baseline via toHaveScreenshot() with project-prefixed names
 *
 * API calls are explicitly mocked with an allowlist (see mock-api.ts):
 *   - Known entities/functions → deterministic 200 responses
 *   - Unknown API paths → 599 UNMOCKED_API_PATH (fails the test loudly)
 *
 * Only browser-level requests for missing static assets (favicon, manifest) are
 * filtered, as these are automatically requested by the browser and their absence
 * is not an application error.
 *
 * Visual baselines are stored in e2e/visual.spec.ts-snapshots/ and MUST be committed.
 * To create initial baselines: npx playwright test --update-snapshots
 * Never update baselines to make tests pass — unapproved visual differences MUST FAIL.
 *
 * CRITICAL: All validation runs inside Base44 MUST use --update-snapshots=none
 * to prevent missing snapshots from being auto-committed as source truth.
 */

const ROUTES = [
  { path: "/login", name: "authentication-entry" },
  { path: "/", name: "public-landing" },
  { path: "/app", name: "home-dashboard" },
  { path: "/visualizer", name: "visualizer" },
  { path: "/leads", name: "leads" },
  { path: "/crm", name: "crm" },
  { path: "/pricing", name: "estimate-pricing" },
  { path: "/appointments", name: "schedule" },
  { path: "/admin", name: "admin" },
];

// Console error patterns that are expected in the test environment.
// Only browser-level requests for missing static assets are filtered.
// All Base44 API calls are explicitly mocked with an allowlist, so:
//   - Real API 404s/5xx → fail the test
//   - SDK errors → fail the test
//   - UNMOCKED_API_PATH (599) → fail the test
// These indicate a genuine regression, not a test-environment artifact.
const EXPECTED_ERROR_PATTERNS = [
  /favicon/i,
  /manifest/i,
];

function isExpectedError(msg: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some((p) => p.test(msg));
}

for (const route of ROUTES) {
  test.describe(`${route.name} (${route.path})`, () => {
    test.beforeEach(async ({ page }) => {
      await setupBase44Mocks(page);
    });

    test("loads and renders without uncaught errors", async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!isExpectedError(text)) consoleErrors.push(text);
        }
      });
      page.on("pageerror", (err) => pageErrors.push(err.message));

      // Detect UNMOCKED_API_PATH (599) responses — these must fail the test
      page.on("response", async (response) => {
        if (response.status() === 599) {
          try {
            const body = await response.text();
            consoleErrors.push(`UNMOCKED_API_PATH (599): ${body}`);
          } catch {
            consoleErrors.push(`UNMOCKED_API_PATH (599): ${response.url()}`);
          }
        }
      });

      const response = await page.goto(route.path, {
        waitUntil: "networkidle",
      });

      // HTTP/page load — 200 or redirect (both valid for auth routes)
      expect(response?.status()).toBeLessThan(500);

      // Body renders visible content (not a blank screen)
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);

      // No uncaught JS exceptions — all page errors are real regressions
      expect(pageErrors).toEqual([]);

      // No unexpected console errors — only favicon/manifest are filtered
      expect(consoleErrors).toEqual([]);
    });

    test("matches visual baseline", async ({ page }, testInfo) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForLoadState("domcontentloaded");

      // Deterministic: disable animations
      await page.emulateMedia({ reducedMotion: "reduce" });

      // Project-prefixed name prevents desktop/mobile collision
      const snapshotName = `${testInfo.project.name}--${route.name}.png`;

      await expect(page).toHaveScreenshot(snapshotName, {
        fullPage: false,
        maxDiffPixelRatio: 0.01,
        threshold: 0.2,
        animations: "disabled",
      });
    });
  });
}

// Regression test: proves /src/api/base44Client.js is never mocked.
// The previous mock used url.includes("/api/") which matched this Vite module
// path, causing Playwright to serve JSON in place of JavaScript → blank pages.
test("regression: /src/api/base44Client.js is never mocked (loads as JavaScript)", async ({ page }) => {
  await setupBase44Mocks(page);

  let moduleContentType = "";
  page.on("response", async (response) => {
    if (response.url().includes("base44Client.js")) {
      moduleContentType = response.headers()["content-type"] || "";
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });

  // The module must have been loaded
  expect(moduleContentType).toBeTruthy();
  // And it must have been served as JavaScript, not JSON
  expect(moduleContentType).toContain("javascript");
  expect(moduleContentType).not.toContain("application/json");
});