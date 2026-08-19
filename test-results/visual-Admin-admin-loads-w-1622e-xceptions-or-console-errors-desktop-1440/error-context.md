# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual.spec.ts >> Admin (/admin) >> loads without uncaught exceptions or console errors
- Location: e2e/visual.spec.ts:24:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 35

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "App state check failed: Base44Error: Request failed with status code 404
+     at http://localhost:5173/node_modules/.vite/deps/chunk-RZSJCXRY.js?v=8eee800c:4308:27
+     at async Axios.request (http://localhost:5173/node_modules/.vite/deps/chunk-RZSJCXRY.js?v=8eee800c:3123:14)
+     at async checkAppState (http://localhost:5173/src/lib/AuthContext.jsx:49:32)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+ ]
```

# Page snapshot

```yaml
- generic [ref=e5]:
  - complementary [ref=e6]:
    - img "Xtreme Floor Visualizer" [ref=e7]
    - navigation [ref=e8]:
      - button "Home" [ref=e9] [cursor=pointer]
      - button "New Bid" [ref=e14] [cursor=pointer]
      - button "Leads" [ref=e19] [cursor=pointer]
      - button "Xtreme AI" [ref=e26] [cursor=pointer]
      - button "More" [ref=e30] [cursor=pointer]
  - generic [ref=e33]:
    - generic [ref=e34]:
      - button "Go back" [ref=e35] [cursor=pointer]
      - textbox "Search projects, locations, systems…" [ref=e42]
      - generic [ref=e43]:
        - button "Reminders" [ref=e45] [cursor=pointer]
        - button "Toggle theme" [ref=e49] [cursor=pointer]
        - button "Account" [ref=e52] [cursor=pointer]: VX
    - generic [ref=e55]:
      - generic [ref=e56]:
        - generic [ref=e57]:
          - heading "Admin · Integrations" [level=1] [ref=e58]
          - paragraph [ref=e62]: Hidden admin console. Connect OAuth services and configure Twilio voice.
        - button "Test All" [ref=e63] [cursor=pointer]
      - generic [ref=e64]:
        - text: This page is not linked in navigation. Bookmark
        - code [ref=e67]: /admin
        - text: to access it.
      - generic [ref=e68]:
        - generic [ref=e69]:
          - generic [ref=e70]:
            - generic [ref=e76]:
              - strong [ref=e77]: Google Gmail
              - text: Inbox sync & email send
            - generic [ref=e78]: Not connected
          - button "Connect" [ref=e80] [cursor=pointer]
        - generic [ref=e84]:
          - generic [ref=e85]:
            - generic [ref=e91]:
              - strong [ref=e92]: Google Calendar
              - text: Appointment sync
            - generic [ref=e93]: Not connected
          - button "Connect" [ref=e95] [cursor=pointer]
        - generic [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e106]:
              - strong [ref=e107]: Google Drive
              - text: Project folder automation
            - generic [ref=e108]: Not connected
          - button "Connect" [ref=e110] [cursor=pointer]
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e121]:
              - strong [ref=e122]: Google Sheets
              - text: Lead export
            - generic [ref=e123]: Not connected
          - button "Connect" [ref=e125] [cursor=pointer]
        - generic [ref=e129]:
          - generic [ref=e130]:
            - generic [ref=e136]:
              - strong [ref=e137]: Google Docs
              - text: Document generation
            - generic [ref=e138]: Connect to verify
          - button "Connect" [ref=e140] [cursor=pointer]
        - generic [ref=e144]:
          - generic [ref=e145]:
            - generic [ref=e151]:
              - strong [ref=e152]: Google Tasks
              - text: Task sync
            - generic [ref=e153]: Connect to verify
          - button "Connect" [ref=e155] [cursor=pointer]
        - generic [ref=e159]:
          - generic [ref=e160]:
            - generic [ref=e166]:
              - strong [ref=e167]: HubSpot
              - text: CRM push
            - generic [ref=e168]: Not connected
          - button "Connect" [ref=e170] [cursor=pointer]
        - generic [ref=e174]:
          - generic [ref=e175]:
            - generic [ref=e181]:
              - strong [ref=e182]: Supabase
              - text: Database
            - generic [ref=e183]: Connect to verify
          - button "Connect" [ref=e185] [cursor=pointer]
      - generic [ref=e189]:
        - generic [ref=e190]: Twilio Voice Agent
        - paragraph [ref=e193]: Enter your Twilio credentials to enable the AI voice assistant. Saved to the admin-only IntegrationConfig store.
        - generic [ref=e194]:
          - strong [ref=e195]: Voice Webhook URL
          - paragraph [ref=e196]:
            - text: "Point your Twilio phone number's voice webhook to:"
            - code [ref=e197]: https://visualx.base44.app/api/functions/twilio-voice
          - button "Test Voice Endpoint" [ref=e198] [cursor=pointer]
        - generic [ref=e201]:
          - generic [ref=e202]:
            - generic [ref=e203]: Account SID
            - textbox "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" [ref=e204]
          - generic [ref=e205]:
            - generic [ref=e206]: Auth Token
            - textbox "••••••••••••••••" [ref=e207]
        - generic [ref=e208]:
          - generic [ref=e209]:
            - generic [ref=e210]: Twilio Phone Number
            - textbox "+1XXXXXXXXXX" [ref=e211]
          - generic [ref=e212]:
            - generic [ref=e213]: SIC Code
            - textbox "e.g. 1541" [ref=e214]
        - button "Save Twilio Config" [ref=e215] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Visual / route certification — validates route loads, uncaught exceptions,
  5  |  * console errors, and responsive rendering at desktop + mobile viewports.
  6  |  *
  7  |  * Routes requiring auth will redirect to /login — that is valid behavior, not a failure.
  8  |  */
  9  | 
  10 | const ROUTES = [
  11 |   { path: "/login", name: "authentication entry" },
  12 |   { path: "/", name: "public landing" },
  13 |   { path: "/app", name: "Home / Dashboard" },
  14 |   { path: "/visualizer", name: "Visualizer" },
  15 |   { path: "/leads", name: "Leads" },
  16 |   { path: "/crm", name: "CRM" },
  17 |   { path: "/pricing", name: "Estimate / Pricing" },
  18 |   { path: "/appointments", name: "Schedule" },
  19 |   { path: "/admin", name: "Admin" },
  20 | ];
  21 | 
  22 | for (const route of ROUTES) {
  23 |   test.describe(`${route.name} (${route.path})`, () => {
  24 |     test("loads without uncaught exceptions or console errors", async ({ page }) => {
  25 |       const errors: string[] = [];
  26 |       const failedRequests: string[] = [];
  27 | 
  28 |       page.on("console", (msg) => {
  29 |         if (msg.type() === "error") errors.push(msg.text());
  30 |       });
  31 |       page.on("pageerror", (err) => errors.push(err.message));
  32 |       page.on("requestfailed", (req) => {
  33 |         const url = req.url();
  34 |         // Ignore favicon and analytics failures
  35 |         if (!url.includes("favicon") && !url.includes("analytics")) {
  36 |           failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
  37 |         }
  38 |       });
  39 | 
  40 |       const response = await page.goto(route.path, { waitUntil: "networkidle" });
  41 | 
  42 |       // Route should load (200 or a redirect to login for authed routes — both are valid)
  43 |       expect(response?.status()).toBeLessThan(500);
  44 | 
  45 |       // No uncaught JS exceptions or console errors
> 46 |       expect(errors).toEqual([]);
     |                      ^ Error: expect(received).toEqual(expected) // deep equality
  47 | 
  48 |       // No critical failed network requests
  49 |       expect(failedRequests).toEqual([]);
  50 | 
  51 |       // Page should render visible content (not a blank screen)
  52 |       const bodyVisible = await page.locator("body").isVisible();
  53 |       expect(bodyVisible).toBe(true);
  54 |     });
  55 | 
  56 |     test("captures screenshot for visual parity", async ({ page }) => {
  57 |       await page.goto(route.path, { waitUntil: "networkidle" });
  58 |       await page.screenshot({
  59 |         path: `e2e/screenshots/${route.name.replace(/[^a-z0-9]/gi, "-")}.png`,
  60 |         fullPage: true,
  61 |       });
  62 |     });
  63 |   });
  64 | }
```