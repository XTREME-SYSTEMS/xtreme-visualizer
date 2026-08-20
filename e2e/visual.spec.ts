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

// ─────────────────────────────────────────────────────────────────────────────
// Response contract regression tests — prove the mock returns shapes that match
// the actual Base44 SDK contract. The SDK response interceptor returns
// response.data (raw HTTP body) directly, so:
//   - list/filter → raw array [] (consumers call .filter(), .find(), for...of)
//   - get/create/update → single object { id: "..." }
//   - unknown entity/function → 599 UNMOCKED_API_PATH
// ─────────────────────────────────────────────────────────────────────────────

const APP_ID = "6a72dc735df4ab468b4b1441";

test.describe("mock response contract", () => {
  test.beforeEach(async ({ page }) => {
    await setupBase44Mocks(page);
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("Lead list returns raw array usable with Array.isArray and .filter()", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}/entities/Lead`);
      const data = await res.json();
      return {
        status: res.status,
        isArray: Array.isArray(data),
        filtered: typeof data.filter === "function" ? data.filter(() => true) : null,
      };
    }, APP_ID);
    expect(result.status).toBe(200);
    expect(result.isArray).toBe(true);
    expect(result.filtered).toEqual([]);
  });

  test("Lead filter returns raw array usable with .filter()", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const q = encodeURIComponent(JSON.stringify({ status: "new" }));
      const res = await fetch(`/api/apps/${appId}/entities/Lead?q=${q}`);
      const data = await res.json();
      return {
        isArray: Array.isArray(data),
        filtered: typeof data.filter === "function" ? data.filter(() => true) : null,
      };
    }, APP_ID);
    expect(result.isArray).toBe(true);
    expect(result.filtered).toEqual([]);
  });

  test("PricingRule list returns array usable with .find()", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}/entities/PricingRule`);
      const data = await res.json();
      return {
        isArray: Array.isArray(data),
        found: typeof data.find === "function" ? data.find(() => false) : null,
      };
    }, APP_ID);
    expect(result.isArray).toBe(true);
    expect(result.found).toBeUndefined();
  });

  test("Appointment list returns iterable array", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}/entities/Appointment`);
      const data = await res.json();
      let iterable = true;
      try { for (const _ of data) break; } catch { iterable = false; }
      return { isArray: Array.isArray(data), iterable };
    }, APP_ID);
    expect(result.isArray).toBe(true);
    expect(result.iterable).toBe(true);
  });

  test("unknown entity returns 599 UNMOCKED_API_PATH", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}/entities/UnknownEntity`);
      const data = await res.json();
      return { status: res.status, error: data.error };
    }, APP_ID);
    expect(result.status).toBe(599);
    expect(result.error).toBe("UNMOCKED_API_PATH");
  });

  test("unknown function returns 599 UNMOCKED_API_PATH", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}/functions/unknownFunction`);
      const data = await res.json();
      return { status: res.status, error: data.error };
    }, APP_ID);
    expect(result.status).toBe(599);
    expect(result.error).toBe("UNMOCKED_API_PATH");
  });

  test("known list/filter does NOT return generic wrapper (must be raw array)", async ({ page }) => {
    const result = await page.evaluate(async (appId) => {
      const res = await fetch(`/api/apps/${appId}/entities/Lead`);
      const data = await res.json();
      return {
        isArray: Array.isArray(data),
        isWrapper: !Array.isArray(data) && typeof data === "object" && data !== null,
      };
    }, APP_ID);
    expect(result.isArray).toBe(true);
    expect(result.isWrapper).toBe(false);
  });
});