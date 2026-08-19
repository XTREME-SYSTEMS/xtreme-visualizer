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
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
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
          - heading "Digital Card Studio" [level=1] [ref=e58]
          - paragraph [ref=e59]: AI-enhanced digital business cards & brochures with QR, logo, and sharing.
        - button "New" [ref=e60] [cursor=pointer]
      - generic [ref=e62]:
        - button [ref=e63] [cursor=pointer]:
          - strong [ref=e64]: Card
        - button [ref=e67] [cursor=pointer]:
          - strong [ref=e68]: Brochure
        - button [ref=e72] [cursor=pointer]:
          - strong [ref=e73]: Saved
      - generic [ref=e76]:
        - generic [ref=e77]: Company Website Scraper
        - paragraph [ref=e81]: Enter your company URL — AI researches the site and auto-fills your card & brochure.
        - textbox "https://yourcompany.com" [ref=e86]
        - button "Scrape & Populate" [disabled] [ref=e87]
      - generic [ref=e90]:
        - generic [ref=e91]: Design & Colors
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]: Primary (background)
            - textbox [ref=e101]: "#0a0a0a"
          - generic [ref=e102]:
            - generic [ref=e103]: Accent
            - textbox [ref=e104]: "#f0f40b"
        - generic [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]: Font
            - combobox [ref=e108]:
              - option "Inter" [selected]
              - option "Georgia"
              - option "Arial"
              - option "Courier New"
          - generic [ref=e109]:
            - generic [ref=e110]: Layout
            - combobox [ref=e111]:
              - option "modern" [selected]
              - option "classic"
              - option "bold"
      - generic [ref=e112]:
        - generic [ref=e113]: Logo
        - textbox "Describe your logo style (optional)" [ref=e116]
        - generic [ref=e117]:
          - generic [ref=e118]: LOGO
          - button "Attach" [ref=e119] [cursor=pointer]
          - button "Generate" [ref=e123] [cursor=pointer]
      - generic [ref=e126]:
        - generic [ref=e127]: Content
        - generic [ref=e130]:
          - generic [ref=e131]:
            - generic [ref=e132]: Full name
            - textbox [ref=e133]
          - generic [ref=e134]:
            - generic [ref=e135]: Title
            - textbox [ref=e136]
        - generic [ref=e137]:
          - generic [ref=e138]: Company
          - textbox [ref=e139]
        - generic [ref=e140]:
          - generic [ref=e141]:
            - generic [ref=e142]: Phone
            - textbox [ref=e143]
          - generic [ref=e144]:
            - generic [ref=e145]: Email
            - textbox [ref=e146]
        - generic [ref=e147]:
          - generic [ref=e148]:
            - generic [ref=e149]: Website
            - textbox [ref=e150]
          - generic [ref=e151]:
            - generic [ref=e152]: Address
            - textbox [ref=e153]
        - generic [ref=e154]:
          - generic [ref=e155]: Bio / About
          - textbox [ref=e156]
        - generic [ref=e157]:
          - generic [ref=e158]: Services
          - generic [ref=e159]:
            - textbox "Add a service" [ref=e160]
            - button [ref=e161] [cursor=pointer]
        - generic [ref=e163]:
          - generic [ref=e164]:
            - generic [ref=e165]: Facebook
            - textbox [ref=e166]
          - generic [ref=e167]:
            - generic [ref=e168]: Instagram
            - textbox [ref=e169]
        - generic [ref=e170]:
          - generic [ref=e171]: LinkedIn
          - textbox [ref=e172]
        - button "AI Enhance Copy" [ref=e173] [cursor=pointer]
      - generic [ref=e176]:
        - generic [ref=e177]: QR Code Generator
        - textbox "URL, contact info, or vCard text" [ref=e184]
      - generic [ref=e185]:
        - heading "Live Preview" [level=3] [ref=e186]
        - generic [ref=e190]:
          - generic [ref=e191]: C
          - generic [ref=e192]:
            - strong [ref=e193]: Your Name
            - text: Title
      - button "Save" [ref=e195] [cursor=pointer]
      - generic [ref=e200]:
        - button "Email" [ref=e201] [cursor=pointer]
        - button "SMS" [ref=e206] [cursor=pointer]
        - button "WhatsApp" [ref=e210] [cursor=pointer]
        - button "Copy" [ref=e218] [cursor=pointer]
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