import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { setupBase44Mocks } from "./fixtures/mock-api";

type AuthMode = "anonymous" | "authenticated";

interface ReviewRoute {
  path: string;
  name: string;
  authMode: AuthMode;
  expectedPageMarker: string | null;
}

const DESKTOP_ROUTES: ReviewRoute[] = [
  { path: "/", name: "public-landing", authMode: "anonymous", expectedPageMarker: "Close more coating jobs" },
  { path: "/pricing", name: "estimate-pricing", authMode: "authenticated", expectedPageMarker: null },
  { path: "/appointments", name: "schedule", authMode: "authenticated", expectedPageMarker: null },
];

const MOBILE_ROUTES: ReviewRoute[] = [
  { path: "/login", name: "authentication-entry", authMode: "anonymous", expectedPageMarker: "Welcome back" },
  { path: "/", name: "public-landing", authMode: "anonymous", expectedPageMarker: "Close more coating jobs" },
  { path: "/app", name: "home-dashboard", authMode: "authenticated", expectedPageMarker: "Business Generator" },
  { path: "/visualizer", name: "visualizer", authMode: "authenticated", expectedPageMarker: null },
  { path: "/leads", name: "leads", authMode: "authenticated", expectedPageMarker: null },
  { path: "/crm", name: "crm", authMode: "authenticated", expectedPageMarker: null },
  { path: "/pricing", name: "estimate-pricing", authMode: "authenticated", expectedPageMarker: null },
  { path: "/appointments", name: "schedule", authMode: "authenticated", expectedPageMarker: null },
  { path: "/admin", name: "admin", authMode: "authenticated", expectedPageMarker: null },
];

const EXPECTED_ERROR_PATTERNS = [/favicon/i, /manifest/i];
const APP_ID = "6a72dc735df4ab468b4b1441";

function isExpectedError(msg: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some((pattern) => pattern.test(msg));
}

function hashFile(fp: string): string {
  const buf = fs.readFileSync(fp);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

test("capture governed visual review packet", async ({ browser }, testInfo) => {
  const isDesktop = testInfo.project.name === "desktop-1440";
  const routes = isDesktop ? DESKTOP_ROUTES : MOBILE_ROUTES;
  const viewport = isDesktop ? { width: 1440, height: 1100 } : { width: 390, height: 844 };
  const viewportLabel = `${viewport.width}x${viewport.height}`;
  const subdir = isDesktop ? "desktop" : "mobile";
  const outputDir = path.join(process.cwd(), ".validation", "visual-review", subdir);
  fs.mkdirSync(outputDir, { recursive: true });

  const records: Array<Record<string, unknown>> = [];

  // Isolated fail-closed probe. This proves the mock is active without contaminating route receipts.
  {
    const context = await browser.newContext({
      baseURL: "http://localhost:5173",
      viewport,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    await setupBase44Mocks(page);
    await page.goto("/", { waitUntil: "networkidle" });
    const probe = await page.evaluate(async (appId) => {
      const known = await fetch(`/api/apps/${appId}/entities/Lead`);
      const knownBody = await known.json();
      const unknown = await fetch(`/api/apps/${appId}/entities/OvernightUnknownEntity`);
      const unknownBody = await unknown.json();
      return {
        knownStatus: known.status,
        knownIsArray: Array.isArray(knownBody),
        unknownStatus: unknown.status,
        unknownError: unknownBody?.error,
      };
    }, APP_ID);
    expect(probe.knownStatus).toBe(200);
    expect(probe.knownIsArray).toBe(true);
    expect(probe.unknownStatus).toBe(599);
    expect(probe.unknownError).toBe("UNMOCKED_API_PATH");
    await context.close();
  }

  for (const route of routes) {
    const context = await browser.newContext({
      baseURL: "http://localhost:5173",
      viewport,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    await setupBase44Mocks(page, { authenticated: route.authMode === "authenticated" });

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const unknownApi599: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error" && !isExpectedError(msg.text())) consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", async (response) => {
      if (response.status() === 599) {
        try {
          unknownApi599.push(await response.text());
        } catch {
          unknownApi599.push(response.url());
        }
      }
    });

    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    await page.waitForLoadState("domcontentloaded");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => document.fonts.ready);

    // Route identity: verify final path matches requested path and page marker is present
    const finalUrl = page.url();
    const finalPath = new URL(finalUrl).pathname;
    const requestedPath = route.path;

    let pageMarkerFound = true;
    if (route.expectedPageMarker) {
      const bodyText = await page.locator("body").innerText();
      pageMarkerFound = bodyText.includes(route.expectedPageMarker);
    }

    const routeIdentityResult =
      finalPath === requestedPath && pageMarkerFound ? "PASS" : "FAIL";

    const bodyVisible = await page.locator("body").isVisible();
    const bodyTextLength = (await page.locator("body").innerText()).trim().length;
    const root = page.locator("#root");
    const rootCount = await root.count();
    const rootHtmlLength = rootCount ? (await root.innerHTML()).trim().length : 0;

    let moduleContentType = "";
    const moduleResponse = await page.request.get("http://localhost:5173/src/api/base44Client.js");
    moduleContentType = moduleResponse.headers()["content-type"] || "";

    const screenshotPath = path.join(outputDir, `${route.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotExists = fs.existsSync(screenshotPath);
    const screenshotSize = screenshotExists ? fs.statSync(screenshotPath).size : 0;
    const screenshotHash = screenshotExists ? hashFile(screenshotPath) : "";

    const functionalResult =
      !!response &&
      response.status() < 500 &&
      bodyVisible &&
      rootHtmlLength > 100 &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      unknownApi599.length === 0 &&
      moduleContentType.includes("javascript") &&
      !moduleContentType.includes("application/json") &&
      screenshotExists &&
      screenshotSize > 5000
        ? "PASS"
        : "FAIL";

    const record = {
      requestedPath,
      finalPath,
      authMode: route.authMode,
      expectedPageMarker: route.expectedPageMarker,
      pageMarkerFound,
      routeIdentityResult,
      name: route.name,
      viewport: viewportLabel,
      filePath: `.validation/visual-review/${subdir}/${route.name}.png`,
      httpStatus: response?.status() ?? null,
      bodyVisible,
      bodyTextLength,
      rootHtmlLength,
      moduleContentType,
      consoleErrorCount: consoleErrors.length,
      pageErrorCount: pageErrors.length,
      unknownApi599Count: unknownApi599.length,
      consoleErrors,
      pageErrors,
      unknownApi599,
      screenshotExists,
      screenshotSize,
      screenshotHash,
      functionalResult,
    };

    records.push(record);

    // Capture integrity assertions
    expect(record.httpStatus).toBeLessThan(500);
    expect(record.bodyVisible).toBe(true);
    expect(record.rootHtmlLength).toBeGreaterThan(100);
    expect(record.consoleErrorCount).toBe(0);
    expect(record.pageErrorCount).toBe(0);
    expect(record.unknownApi599Count).toBe(0);
    expect(record.moduleContentType).toContain("javascript");
    expect(record.moduleContentType).not.toContain("application/json");
    expect(record.screenshotExists).toBe(true);
    expect(record.screenshotSize).toBeGreaterThan(5000);

    // Route identity assertions — a capture that renders the wrong page MUST FAIL
    expect(record.routeIdentityResult).toBe("PASS");
    expect(record.finalPath).toBe(record.requestedPath);
    if (route.expectedPageMarker) {
      expect(record.pageMarkerFound).toBe(true);
    }

    await context.close();
  }

  // Public landing sanity: mobile "/" hash must differ from mobile "/app" hash.
  // If they are identical, the anonymous capture redirected to the authenticated Home route.
  let publicLandingVsHomeDistinct: boolean | null = null;
  if (!isDesktop) {
    const publicLandingPath = path.join(outputDir, "public-landing.png");
    const homeDashboardPath = path.join(outputDir, "home-dashboard.png");
    if (fs.existsSync(publicLandingPath) && fs.existsSync(homeDashboardPath)) {
      publicLandingVsHomeDistinct = hashFile(publicLandingPath) !== hashFile(homeDashboardPath);
    }
    expect(publicLandingVsHomeDistinct).toBe(true);
  }

  const resultsPath = path.join(process.cwd(), ".validation", `review-${subdir}.json`);
  fs.writeFileSync(
    resultsPath,
    JSON.stringify({ records, publicLandingVsHomeDistinct }, null, 2),
  );
});