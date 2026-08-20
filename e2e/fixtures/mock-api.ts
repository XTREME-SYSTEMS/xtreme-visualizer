import type { Page, Route } from "@playwright/test";

/**
 * Deterministic Base44 API mock for E2E testing.
 *
 * Strategy: intercept ALL requests to /api/ paths (both GET and POST),
 * returning controlled mock data. Non-API requests (Vite modules, static
 * assets, page HTML) pass through to the Vite dev server.
 *
 * This eliminates ALL real API 404s — every Base44 SDK call (auth, entity
 * filter/list/create, function invoke, integration) receives a deterministic
 * 200 response with mock data. The test can then enforce strict error
 * checking: any unexpected console error or page error is a real regression.
 *
 * Mocked endpoints:
 *   /api/auth/*        → mock authenticated admin user (200)
 *   /api/functions/*   → empty success response (200)
 *   /api/entities/*    → empty data array (200)
 *   /api/integrations/* → empty data (200)
 *   other /api/*       → empty data (200)
 *
 * Non-/api/ requests pass through untouched to Vite.
 */

const MOCK_USER = {
  id: "e2e-test-user-id",
  email: "e2e-test@xtreme-visualizer.com",
  full_name: "E2E Test User",
  role: "admin",
  created_date: "2024-01-01T00:00:00.000Z",
  updated_date: "2024-01-01T00:00:00.000Z",
};

export async function setupBase44Mocks(page: Page): Promise<void> {
  // Set mock auth token so the SDK considers the user authenticated
  await page.addInitScript(() => {
    localStorage.setItem("base44_access_token", "mock-e2e-token");
  });

  await page.route("**/*", async (route: Route) => {
    const request = route.request();
    const url = request.url();

    // Only intercept Base44 API calls (URLs containing /api/).
    // All non-API requests (Vite HMR, modules, static assets, page HTML) pass through.
    if (!url.includes("/api/")) {
      return route.continue();
    }

    // Auth endpoints → mock authenticated admin user
    if (url.includes("/api/auth")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }

    // Function invocations → empty success response
    if (url.includes("/api/functions")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {}, ok: true }),
      });
    }

    // Entity, integration, and all other API endpoints → empty data
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], items: [], total: 0 }),
    });
  });
}