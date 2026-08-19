# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual.spec.ts >> CRM (/crm) >> loads without uncaught exceptions or console errors
- Location: e2e/visual.spec.ts:24:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 30

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
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
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
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
        - heading "Digital Card Studio" [level=1] [ref=e31]
        - paragraph [ref=e32]: AI-enhanced digital business cards & brochures with QR, logo, and sharing.
      - button "New" [ref=e33] [cursor=pointer]
    - generic [ref=e35]:
      - button [ref=e36] [cursor=pointer]:
        - strong [ref=e37]: Card
      - button [ref=e40] [cursor=pointer]:
        - strong [ref=e41]: Brochure
      - button [ref=e45] [cursor=pointer]:
        - strong [ref=e46]: Saved
    - generic [ref=e49]:
      - generic [ref=e50]: Company Website Scraper
      - paragraph [ref=e54]: Enter your company URL — AI researches the site and auto-fills your card & brochure.
      - textbox "https://yourcompany.com" [ref=e59]
      - button "Scrape & Populate" [disabled] [ref=e60]
    - generic [ref=e63]:
      - generic [ref=e64]: Design & Colors
      - generic [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e73]: Primary (background)
          - textbox [ref=e74]: "#0a0a0a"
        - generic [ref=e75]:
          - generic [ref=e76]: Accent
          - textbox [ref=e77]: "#f0f40b"
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]: Font
          - combobox [ref=e81]:
            - option "Inter" [selected]
            - option "Georgia"
            - option "Arial"
            - option "Courier New"
        - generic [ref=e82]:
          - generic [ref=e83]: Layout
          - combobox [ref=e84]:
            - option "modern" [selected]
            - option "classic"
            - option "bold"
    - generic [ref=e85]:
      - generic [ref=e86]: Logo
      - textbox "Describe your logo style (optional)" [ref=e89]
      - generic [ref=e90]:
        - generic [ref=e91]: LOGO
        - button "Attach" [ref=e92] [cursor=pointer]
        - button "Generate" [ref=e96] [cursor=pointer]
    - generic [ref=e99]:
      - generic [ref=e100]: Content
      - generic [ref=e103]:
        - generic [ref=e104]:
          - generic [ref=e105]: Full name
          - textbox [ref=e106]
        - generic [ref=e107]:
          - generic [ref=e108]: Title
          - textbox [ref=e109]
      - generic [ref=e110]:
        - generic [ref=e111]: Company
        - textbox [ref=e112]
      - generic [ref=e113]:
        - generic [ref=e114]:
          - generic [ref=e115]: Phone
          - textbox [ref=e116]
        - generic [ref=e117]:
          - generic [ref=e118]: Email
          - textbox [ref=e119]
      - generic [ref=e120]:
        - generic [ref=e121]:
          - generic [ref=e122]: Website
          - textbox [ref=e123]
        - generic [ref=e124]:
          - generic [ref=e125]: Address
          - textbox [ref=e126]
      - generic [ref=e127]:
        - generic [ref=e128]: Bio / About
        - textbox [ref=e129]
      - generic [ref=e130]:
        - generic [ref=e131]: Services
        - generic [ref=e132]:
          - textbox "Add a service" [ref=e133]
          - button [ref=e134] [cursor=pointer]
      - generic [ref=e136]:
        - generic [ref=e137]:
          - generic [ref=e138]: Facebook
          - textbox [ref=e139]
        - generic [ref=e140]:
          - generic [ref=e141]: Instagram
          - textbox [ref=e142]
      - generic [ref=e143]:
        - generic [ref=e144]: LinkedIn
        - textbox [ref=e145]
      - button "AI Enhance Copy" [ref=e146] [cursor=pointer]
    - generic [ref=e149]:
      - generic [ref=e150]: QR Code Generator
      - textbox "URL, contact info, or vCard text" [ref=e157]
    - generic [ref=e158]:
      - heading "Live Preview" [level=3] [ref=e159]
      - generic [ref=e163]:
        - generic [ref=e164]: C
        - generic [ref=e165]:
          - strong [ref=e166]: Your Name
          - text: Title
    - button "Save" [ref=e168] [cursor=pointer]
    - generic [ref=e173]:
      - button "Email" [ref=e174] [cursor=pointer]
      - button "SMS" [ref=e179] [cursor=pointer]
      - button "WhatsApp" [ref=e183] [cursor=pointer]
      - button "Copy" [ref=e191] [cursor=pointer]
  - navigation [ref=e196]:
    - button "Home" [ref=e197] [cursor=pointer]
    - button "New Bid" [ref=e202] [cursor=pointer]
    - button "Leads" [ref=e207] [cursor=pointer]
    - button "Xtreme AI" [ref=e214] [cursor=pointer]
    - button "More" [ref=e218] [cursor=pointer]
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