import type { Page, Route } from "@playwright/test";

/**
 * Mock Base44 API for deterministic E2E testing.
 *
 * The Base44 SDK (serverUrl: '') makes relative API calls proxied by @base44/vite-plugin.
 * In local dev without auth, these return 404 — causing console errors that mask real bugs.
 *
 * This mock intercepts all non-asset requests and returns deterministic data:
 * - Auth calls → mock authenticated admin user
 * - Entity calls → empty arrays (deterministic empty/loading states)
 * - Function calls → mock success
 *
 * Static assets, Vite internals, and HTML pages pass through unchanged.
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
    const accept = request.headers()["accept"] || "";

    // Static assets (by extension) — let Vite serve them
    if (
      /\.(js|jsx|ts|tsx|mjs|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|map|webp|avif|json)(\?|$)/i.test(
        url
      )
    ) {
      return route.continue();
    }

    // Vite internals — continue
    if (
      url.includes("/@vite/") ||
      url.includes("/@fs/") ||
      url.includes("/@react-refresh") ||
      url.includes("/node_modules/")
    ) {
      return route.continue();
    }

    // Source files — continue
    if (url.includes("/src/")) {
      return route.continue();
    }

    // Page navigation (HTML document) — continue
    if (accept.includes("text/html")) {
      return route.continue();
    }

    // Everything below is an API call — return mock data

    // Auth endpoints → mock user
    if (url.includes("auth")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }

    // All other API calls → empty data (deterministic empty states)
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], items: [], total: 0 }),
    });
  });
}