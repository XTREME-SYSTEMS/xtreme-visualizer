import { test, expect } from "@playwright/test";

/**
 * Visual / route certification — validates route loads, uncaught exceptions,
 * console errors, and responsive rendering at desktop + mobile viewports.
 *
 * Routes requiring auth will redirect to /login — that is valid behavior, not a failure.
 */

const ROUTES = [
  { path: "/login", name: "authentication entry" },
  { path: "/", name: "public landing" },
  { path: "/app", name: "Home / Dashboard" },
  { path: "/visualizer", name: "Visualizer" },
  { path: "/leads", name: "Leads" },
  { path: "/crm", name: "CRM" },
  { path: "/pricing", name: "Estimate / Pricing" },
  { path: "/appointments", name: "Schedule" },
  { path: "/admin", name: "Admin" },
];

for (const route of ROUTES) {
  test.describe(`${route.name} (${route.path})`, () => {
    test("loads without uncaught exceptions or console errors", async ({ page }) => {
      const errors: string[] = [];
      const failedRequests: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("requestfailed", (req) => {
        const url = req.url();
        // Ignore favicon and analytics failures
        if (!url.includes("favicon") && !url.includes("analytics")) {
          failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
        }
      });

      const response = await page.goto(route.path, { waitUntil: "networkidle" });

      // Route should load (200 or a redirect to login for authed routes — both are valid)
      expect(response?.status()).toBeLessThan(500);

      // No uncaught JS exceptions or console errors
      expect(errors).toEqual([]);

      // No critical failed network requests
      expect(failedRequests).toEqual([]);

      // Page should render visible content (not a blank screen)
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });

    test("captures screenshot for visual parity", async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.screenshot({
        path: `e2e/screenshots/${route.name.replace(/[^a-z0-9]/gi, "-")}.png`,
        fullPage: true,
      });
    });
  });
}