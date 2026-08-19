# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual.spec.ts >> Leads (/leads) >> loads without uncaught exceptions or console errors
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
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
+   "App state check failed: Base44Error: Request failed with status code 404
+     at http://localhost:5173/node_modules/.vite/deps/chunk-RZSJCXRY.js?v=8eee800c:4308:27
+     at async Axios.request (http://localhost:5173/node_modules/.vite/deps/chunk-RZSJCXRY.js?v=8eee800c:3123:14)
+     at async checkAppState (http://localhost:5173/src/lib/AuthContext.jsx:49:32)",
+   "[Base44 SDK Error] 404: Request failed with status code 404",
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
    - img "Xtreme Floor Visualizer" [ref=e8]
    - generic [ref=e9]:
      - button "Reminders" [ref=e11] [cursor=pointer]
      - button "Search" [ref=e15] [cursor=pointer]
      - button "Toggle theme" [ref=e19] [cursor=pointer]
      - button "Account" [ref=e22] [cursor=pointer]: VX
  - generic [ref=e25]:
    - generic [ref=e26]:
      - generic [ref=e27]:
        - heading "Customers" [level=1] [ref=e28]
        - paragraph [ref=e29]: Every customer from the visualizer, lead generator, and manual entry.
      - button "Customer" [ref=e30] [cursor=pointer]
    - generic [ref=e33]:
      - generic [ref=e34]:
        - strong [ref=e35]: "0"
        - generic [ref=e36]: Total
      - generic [ref=e37]:
        - strong [ref=e38]: "0"
        - generic [ref=e39]: New
      - generic [ref=e40]:
        - strong [ref=e41]: "0"
        - generic [ref=e42]: Active
      - generic [ref=e43]:
        - strong [ref=e44]: "0"
        - generic [ref=e45]: Won
    - generic [ref=e46]:
      - button "Sync HubSpot" [ref=e47] [cursor=pointer]
      - button "Sync Drive" [ref=e54] [cursor=pointer]
    - generic [ref=e58]:
      - textbox "Search name, email, address, system…" [ref=e63]
      - generic [ref=e64]:
        - button "All" [ref=e65] [cursor=pointer]
        - button "New" [ref=e66] [cursor=pointer]
        - button "Qualified" [ref=e67] [cursor=pointer]
        - button "Estimate" [ref=e68] [cursor=pointer]
        - button "Proposal" [ref=e69] [cursor=pointer]
        - button "Follow Up" [ref=e70] [cursor=pointer]
        - button "Won" [ref=e71] [cursor=pointer]
        - button "Lost" [ref=e72] [cursor=pointer]
    - generic [ref=e74]:
      - generic [ref=e75]: "0"
      - text: No customers yet. Add one or generate a bid.
  - navigation [ref=e76]:
    - button "Home" [ref=e77] [cursor=pointer]
    - button "New Bid" [ref=e82] [cursor=pointer]
    - button "Leads" [ref=e87] [cursor=pointer]
    - button "Xtreme AI" [ref=e94] [cursor=pointer]
    - button "More" [ref=e98] [cursor=pointer]
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