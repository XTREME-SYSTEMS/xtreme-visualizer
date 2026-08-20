import { test, expect } from "@playwright/test";
import { setupBase44Mocks } from "./fixtures/mock-api";
import * as fs from "fs";
import * as path from "path";

const DESKTOP_ROUTES = [
  { path: "/", name: "public-landing" },
  { path: "/pricing", name: "estimate-pricing" },
  { path: "/appointments", name: "schedule" },
];

const MOBILE_ROUTES = [
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

const EXPECTED_ERROR_PATTERNS = [/favicon/i, /manifest/i];
function isExpectedError(msg: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some((p) => p.test(msg));
}

interface RouteResult {
  route: string;
  viewport: string;
  filePath: string;
  dimensions: string;
  functionalResult: string;
  consoleErrors: string[];
  pageErrors: string[];
  unknownApi599: string[];
  screenshotExists: boolean;
  screenshotSize: number;
}

// Use a directory OUTSIDE test-results to avoid Playwright clearing it between projects
const OUTPUT_BASE = path.join(process.cwd(), "visual-review-capture");

test.describe("capture review screenshots", () => {
  test("capture all review screenshots for current project", async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === "desktop-1440";
    const routes = isDesktop ? DESKTOP_ROUTES : MOBILE_ROUTES;
    const subdir = isDesktop ? "desktop" : "mobile";
    const viewport = isDesktop ? "1440x1100" : "390x844";

    const outputDir = path.join(OUTPUT_BASE, subdir);
    fs.mkdirSync(outputDir, { recursive: true });

    const results: RouteResult[] = [];

    for (const route of routes) {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const unknownApi599: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!isExpectedError(text)) consoleErrors.push(text);
        }
      });
      page.on("pageerror", (err) => pageErrors.push(err.message));
      page.on("response", async (response) => {
        if (response.status() === 599) {
          try {
            const body = await response.text();
            unknownApi599.push(body);
          } catch {
            unknownApi599.push(response.url());
          }
        }
      });

      const response = await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForLoadState("domcontentloaded");
      await page.emulateMedia({ reducedMotion: "reduce" });

      const screenshotPath = path.join(outputDir, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const screenshotExists = fs.existsSync(screenshotPath);
      const screenshotSize = screenshotExists ? fs.statSync(screenshotPath).size : 0;

      const functionalResult =
        response && response.status() < 500 &&
        pageErrors.length === 0 &&
        consoleErrors.length === 0 &&
        unknownApi599.length === 0
          ? "PASS"
          : "FAIL";

      results.push({
        route: route.path,
        viewport,
        filePath: `test-results/visual-review/${subdir}/${route.name}.png`,
        dimensions: viewport,
        functionalResult,
        consoleErrors,
        pageErrors,
        unknownApi599,
        screenshotExists,
        screenshotSize,
      });
    }

    const resultsPath = path.join(OUTPUT_BASE, `${subdir}-results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  });
});