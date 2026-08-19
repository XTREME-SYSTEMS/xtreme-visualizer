import type { Page, Route } from "@playwright/test";

/**
 * Mock Base44 API for deterministic E2E testing.
 *
 * Strategy: only intercept POST requests (entity filter/create/update/delete,
 * function invocations). GET requests (scripts, styles, pages, auth) pass through
 * to Vite. This prevents accidentally serving JSON for JavaScript module requests.
 *
 * Expected 404 errors from unauthenticated GET API calls (auth/me, entity list)
 * are filtered in the test as expected test-environment behavior, not real app errors.
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
    const method = request.method();

    // Only mock POST requests (API calls that submit data).
    // All GET requests (scripts, styles, pages, auth) pass through to Vite.
    if (method !== "POST") {
      return route.continue();
    }

    // Auth endpoints → mock user
    if (url.includes("auth")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }

    // All other POST API calls → empty data (deterministic empty states)
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], items: [], total: 0 }),
    });
  });
}