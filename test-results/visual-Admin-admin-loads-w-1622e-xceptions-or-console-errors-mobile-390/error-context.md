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
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
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
  - generic [ref=e6]:
    - generic [ref=e7]:
      - button "Go back" [ref=e8] [cursor=pointer]
      - img "Xtreme Floor Visualizer" [ref=e11]
    - generic [ref=e12]:
      - button "Reminders" [ref=e14] [cursor=pointer]
      - button "Search" [ref=e18] [cursor=pointer]
      - button "Toggle theme" [ref=e22] [cursor=pointer]
      - button "Account" [ref=e25] [cursor=pointer]: VX
  - generic [ref=e28]:
    - generic [ref=e29]:
      - generic [ref=e30]:
        - heading "Admin · Integrations" [level=1] [ref=e31]
        - paragraph [ref=e35]: Hidden admin console. Connect OAuth services and configure Twilio voice.
      - button "Test All" [ref=e36] [cursor=pointer]
    - generic [ref=e37]:
      - text: This page is not linked in navigation. Bookmark
      - code [ref=e40]: /admin
      - text: to access it.
    - generic [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e49]:
            - strong [ref=e50]: Google Gmail
            - text: Inbox sync & email send
          - generic [ref=e51]: Not connected
        - button "Connect" [ref=e53] [cursor=pointer]
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e64]:
            - strong [ref=e65]: Google Calendar
            - text: Appointment sync
          - generic [ref=e66]: Not connected
        - button "Connect" [ref=e68] [cursor=pointer]
      - generic [ref=e72]:
        - generic [ref=e73]:
          - generic [ref=e79]:
            - strong [ref=e80]: Google Drive
            - text: Project folder automation
          - generic [ref=e81]: Not connected
        - button "Connect" [ref=e83] [cursor=pointer]
      - generic [ref=e87]:
        - generic [ref=e88]:
          - generic [ref=e94]:
            - strong [ref=e95]: Google Sheets
            - text: Lead export
          - generic [ref=e96]: Not connected
        - button "Connect" [ref=e98] [cursor=pointer]
      - generic [ref=e102]:
        - generic [ref=e103]:
          - generic [ref=e109]:
            - strong [ref=e110]: Google Docs
            - text: Document generation
          - generic [ref=e111]: Connect to verify
        - button "Connect" [ref=e113] [cursor=pointer]
      - generic [ref=e117]:
        - generic [ref=e118]:
          - generic [ref=e124]:
            - strong [ref=e125]: Google Tasks
            - text: Task sync
          - generic [ref=e126]: Connect to verify
        - button "Connect" [ref=e128] [cursor=pointer]
      - generic [ref=e132]:
        - generic [ref=e133]:
          - generic [ref=e139]:
            - strong [ref=e140]: HubSpot
            - text: CRM push
          - generic [ref=e141]: Not connected
        - button "Connect" [ref=e143] [cursor=pointer]
      - generic [ref=e147]:
        - generic [ref=e148]:
          - generic [ref=e154]:
            - strong [ref=e155]: Supabase
            - text: Database
          - generic [ref=e156]: Connect to verify
        - button "Connect" [ref=e158] [cursor=pointer]
    - generic [ref=e162]:
      - generic [ref=e163]: Twilio Voice Agent
      - paragraph [ref=e166]: Enter your Twilio credentials to enable the AI voice assistant. Saved to the admin-only IntegrationConfig store.
      - generic [ref=e167]:
        - strong [ref=e168]: Voice Webhook URL
        - paragraph [ref=e169]:
          - text: "Point your Twilio phone number's voice webhook to:"
          - code [ref=e170]: https://visualx.base44.app/api/functions/twilio-voice
        - button "Test Voice Endpoint" [ref=e171] [cursor=pointer]
      - generic [ref=e174]:
        - generic [ref=e175]:
          - generic [ref=e176]: Account SID
          - textbox "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" [ref=e177]
        - generic [ref=e178]:
          - generic [ref=e179]: Auth Token
          - textbox "••••••••••••••••" [ref=e180]
      - generic [ref=e181]:
        - generic [ref=e182]:
          - generic [ref=e183]: Twilio Phone Number
          - textbox "+1XXXXXXXXXX" [ref=e184]
        - generic [ref=e185]:
          - generic [ref=e186]: SIC Code
          - textbox "e.g. 1541" [ref=e187]
      - button "Save Twilio Config" [ref=e188] [cursor=pointer]
  - navigation [ref=e193]:
    - button "Home" [ref=e194] [cursor=pointer]
    - button "New Bid" [ref=e199] [cursor=pointer]
    - button "Leads" [ref=e204] [cursor=pointer]
    - button "Xtreme AI" [ref=e211] [cursor=pointer]
    - button "More" [ref=e215] [cursor=pointer]
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