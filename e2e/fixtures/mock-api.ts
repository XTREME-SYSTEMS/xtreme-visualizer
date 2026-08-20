import type { Page, Route } from "@playwright/test";

/**
 * Deterministic Base44 API mock for E2E testing.
 *
 * CRITICAL FIX: Uses `new URL(request.url()).pathname.startsWith("/api/")`
 * instead of `url.includes("/api/")`. The substring match incorrectly matched
 * `/src/api/base44Client.js` (a Vite JavaScript module), causing Playwright to
 * serve JSON in place of the JS module → blank pages → visual diff failures.
 *
 * CRITICAL FIX: Uses `page.context().route()` (browser-context routing) instead
 * of `page.route()` (page-level routing). Context-level routing intercepts
 * requests from service workers and web workers that bypass page-level routing.
 * Combined with `serviceWorkers: "block"` in playwright.config.ts, this ensures
 * every Base44 API request is deterministically intercepted.
 *
 * CRITICAL FIX: Explicit allowlist — only known entity and function paths receive
 * mock responses. Unknown API paths return HTTP 599 with `UNMOCKED_API_PATH`,
 * causing the E2E test to fail loudly. This prevents broken endpoint names and
 * real integration regressions from being silently swallowed.
 *
 * Non-/api/ requests (Vite modules, static assets, page HTML) pass through
 * untouched to the Vite dev server.
 */

const MOCK_USER = {
  id: "e2e-test-user-id",
  email: "e2e-test@xtreme-visualizer.com",
  full_name: "E2E Test User",
  role: "admin",
  created_date: "2024-01-01T00:00:00.000Z",
  updated_date: "2024-01-01T00:00:00.000Z",
};

// All known entity names used by the application.
// An unknown entity name → 599 UNMOCKED_API_PATH (fail-closed).
const KNOWN_ENTITIES = new Set([
  "User", "FloorSystem", "Product", "ColorChart", "Project", "Lead", "Quote",
  "Proposal", "FeatureFlag", "IntegrationConfig", "Appointment", "WorkOrder",
  "Invoice", "MaintenanceSubscription", "Base44Purchase", "VoiceScript",
  "Subcontractor", "GalleryImage", "MarketingAsset", "TrackingEvent", "Scope",
  "Signature", "ActivityReceipt", "Message", "MessageTemplate", "EmailTemplate",
  "PricingProfile", "PricingRule", "MarketPrice", "CostOfBusiness", "JobCost",
  "ChangeOrder", "ProjectStep", "PunchItem", "FieldPhoto", "ClockEvent",
  "AuditLog", "Enhancement", "ScrapeJob", "FollowupPlan", "Visualization",
  "VisualizationConcept", "BrandAsset", "SkinPreset", "SkinVersion",
  "SkinAssignment", "LayoutPreset", "ComponentPreset", "BackgroundPreset",
  "MotionPreset", "PalettePreset", "FontPairing", "EnvironmentProfile",
  "FinishProfile", "IndustryTemplate",
  // AutoLead entities
  "AutoLeadOpportunity", "AutoLeadBenchmark", "AutoLeadVerificationReceipt",
  "AutoLeadConversionReceipt", "AutoLeadProject", "AutoLeadProposalPackage",
  "AutoLeadAgentTask", "AutoLeadNotification", "AutoLeadSignedContract",
  "AutoLeadUser", "AutoLeadRecommendation", "AutoLeadInvoice",
  "AutoLeadProjectImage", "AutoLeadContractorApp", "AutoLeadSystemGap",
  "AutoLeadBrandAsset", "AutoLeadEsignDocument", "AutoLeadBidInvitation",
  "AutoLeadContact", "AutoLeadMaterial", "AutoLeadEstimate",
  "AutoLeadMessage", "AutoLeadPaymentPreference", "AutoLeadScopeSystem",
  "AutoLeadActionItem", "AutoLeadProposal", "AutoLeadCompanyProfile",
  "AutoLeadSystemScore", "AutoLeadPricingProfile", "AutoLeadScrapeSource",
  "AutoLeadTakeoff", "AutoLeadPayment", "AutoLeadContractTemplate",
  "AutoLeadAutomationConfig", "AutoLeadEmailTemplate",
]);

// All known backend function names.
// An unknown function name → 599 UNMOCKED_API_PATH (fail-closed).
const KNOWN_FUNCTIONS = new Set([
  "autoDepositOnSignature", "browserbaseScrape", "checkConnectorStatus",
  "convertAutoLeadOpportunity", "create-checkout", "createCalendarAppointment",
  "createDriveFolder", "fetchLocalPricing", "generateInvoice", "generateWarranty",
  "getCustomerPortal", "gmail", "hubspot", "payments-webhook", "pushLeadToHubSpot",
  "rejectAutoLeadOpportunity", "runAppointmentReminders", "runFollowupPlans",
  "runLostLeadRecovery", "runReviewRequests", "scrapeXpsCatalog",
  "seedColorCharts", "sendGmailMessage", "sendLeadFollowup",
  "sendLostLeadRecovery", "sendMaterialOrder", "sendReviewRequest",
  "sendScrapeEmails", "stageAutoLeadOpportunity", "syncLeadsToGoogleSheet",
  "twilio-voice", "verifyAutoLeadOpportunity",
]);

function unmockedResponse(method: string, pathname: string) {
  return {
    status: 599,
    contentType: "application/json",
    body: JSON.stringify({ error: "UNMOCKED_API_PATH", method, path: pathname }),
  };
}

export async function setupBase44Mocks(
  page: Page,
  options: { authenticated?: boolean } = {},
): Promise<void> {
  const { authenticated = true } = options;

  // Auth state: seed (authenticated) or clear (anonymous) the access token before
  // app modules initialize. Default remains authenticated=true so all existing
  // functional E2E tests are unchanged unless explicitly opting into anonymous mode.
  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem("base44_access_token", "mock-e2e-token");
    });
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem("base44_access_token");
    });
  }

  // CRITICAL: Use browser-context routing, not page-level routing.
  // Context-level routing intercepts requests from service workers and
  // web workers that bypass page.route(). Combined with serviceWorkers:"block"
  // in playwright.config.ts, this ensures full interception coverage.
  const context = page.context();

  await context.route("**/*", async (route: Route) => {
    const request = route.request();
    // CRITICAL: Parse URL and check pathname.startsWith("/api/").
    // NEVER use url.includes("/api/") — it matches /src/api/base44Client.js
    // (a Vite JS module) and serves JSON in its place → blank pages.
    const parsedUrl = new URL(request.url());
    const pathname = parsedUrl.pathname;
    const method = request.method();

    // Only intercept Base44 API calls (pathname starts with /api/).
    // All non-API requests (Vite HMR, modules, static assets, page HTML) pass through.
    if (!pathname.startsWith("/api/")) {
      return route.continue();
    }

    // 1. User/me endpoint → mock authenticated admin user
    if (pathname.includes("/entities/User/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }

    // 2. Public settings → empty settings object
    if (pathname.includes("/public-settings/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    }

    // 3. Analytics track batch → safe success
    if (pathname.includes("/analytics/track")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    }

    // 4. Entity endpoints → shape depends on method + subPath
    //    Pattern: /api/apps/{APP_ID}/entities/{EntityName}[/{subPath}]
    //
    //    CRITICAL: The Base44 SDK response interceptor returns `response.data`
    //    (the raw HTTP body) directly — NOT the axios response wrapper.
    //    Frontend consumers call .filter(), .find(), for...of on the result.
    //    Therefore list/filter MUST return a raw array `[]`, NOT a wrapper
    //    object like `{ data: [], items: [], total: 0 }`.
    const entityMatch = pathname.match(/^\/api\/apps\/[^/]+\/entities\/([^/]+)(?:\/(.+))?/);
    if (entityMatch) {
      const entityName = entityMatch[1];
      const subPath = entityMatch[2];

      // Unknown entity → fail-closed
      if (!KNOWN_ENTITIES.has(entityName) && entityName !== "User") {
        return route.fulfill(unmockedResponse(method, pathname));
      }

      // subPath "bulk" → bulkCreate (POST) or bulkUpdate (PUT) → array
      if (subPath === "bulk") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }

      // subPath "update-many" → updateMany (PATCH) → modified count
      if (subPath === "update-many") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ modified: 0 }),
        });
      }

      // subPath is an ID (not filter/list/me) → get/update/delete → single entity
      if (subPath && subPath !== "filter" && subPath !== "list" && subPath !== "me") {
        if (method === "DELETE") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: subPath }),
        });
      }

      // No subPath → list (GET), create (POST), deleteMany (DELETE)
      if (method === "POST") {
        // create → single entity object
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "mock-created-id" }),
        });
      }
      if (method === "DELETE") {
        // deleteMany → count
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ deleted: 0 }),
        });
      }
      // GET → list/filter → RAW ARRAY (SDK interceptor returns response.data directly)
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    // 5. Function endpoints → function-specific success
    //    Pattern: /api/apps/{APP_ID}/functions/{FunctionName}
    const functionMatch = pathname.match(/^\/api\/apps\/[^/]+\/functions\/([^/]+)/);
    if (functionMatch) {
      const functionName = functionMatch[1];

      // Unknown function → fail-closed
      if (!KNOWN_FUNCTIONS.has(functionName)) {
        return route.fulfill(unmockedResponse(method, pathname));
      }

      // Check for ping calls (Admin connector status checks)
      let isPing = false;
      try {
        const postData = request.postDataJSON();
        if (postData && postData.ping === true) isPing = true;
      } catch {
        // Body not JSON or empty — not a ping call
      }

      if (isPing) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, service: functionName }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {}, ok: true }),
      });
    }

    // 6. Integration endpoints (InvokeLLM, UploadFile, GenerateImage, etc.)
    //    Pattern: /api/apps/{APP_ID}/integrations/{Package}/{Endpoint}
    if (pathname.includes("/integrations/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {}, ok: true }),
      });
    }

    // 7. Auth endpoints (login, register, etc.) → mock user
    if (pathname.includes("/auth")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }

    // 8. UNKNOWN API PATH → fail loudly
    return route.fulfill(unmockedResponse(method, pathname));
  });
}