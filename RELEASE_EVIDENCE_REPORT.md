# Xtreme Floor Visualizer — Release Evidence Report

**Date:** 2026-08-20
**Build:** E2E response contract repair pass
**Validator:** Base44 autonomous agent
**App ID:** 6a72dc735df4ab468b4b1441

---

## CURRENT SHA

**Pre-correction SHA:** `13b62cac918ffcbc61f0e5d9bb76551eaa7dc6a2`
**Pre-correction tree:** `9674a7f63a23d1711971d537bde6608b3994eae2`
**Post-correction SHA:** COULD NOT VERIFY — git commands timeout in sandbox
**Git status:** COULD NOT VERIFY — git commands timeout in sandbox

**Files changed this pass (response contract repair):**
- `e2e/fixtures/mock-api.ts` — entity list/filter now returns raw `[]` (not wrapper object)
- `e2e/visual.spec.ts` — added 7 response contract regression tests
- `RELEASE_EVIDENCE_REPORT.md` — updated with current runtime truth

**Operator must run post-correction validation:**
```
git rev-parse HEAD
git rev-parse HEAD^{tree}
git status --porcelain
npm run lint && npm run typecheck && npm test && npm run build
npm audit --omit=dev --audit-level=high
npx playwright test --project=desktop-1440 --update-snapshots=none
npx playwright test --project=mobile-390 --update-snapshots=none
```
**Required:** same SHA, same tree, clean status before and after run.

---

## CORE CLEAN RUN

**At SHA 13b62ca (pre-correction):**

| Gate | Result |
|------|--------|
| `npm ci` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` (frontend + backend) | PASS |
| `npm test` (unit/regression) | PASS (53/53) |
| Payment regression | PASS (35/35) |
| `npm run build` | PASS |
| `npm audit --omit=dev --audit-level=high` | PASS (0 HIGH, 0 CRITICAL, 4 MODERATE) |
| Git tree after validation | CLEAN |

**Core is green. Do not rewrite green production code.**

---

## MOCK CONTRACT RECEIPT

**Root cause of functional failures (`leads.filter is not a function`, `rules?.find is not a function`, `appts is not iterable`):**

The Base44 SDK response interceptor returns `response.data` (the raw HTTP body) directly — NOT the axios response wrapper. Frontend consumers call `.filter()`, `.find()`, `for...of` on the result. The previous mock returned `{ data: [], items: [], total: 0 }` (a wrapper object), so consumers received an object where they expected an array.

**Fix:** Entity list/filter now returns a raw `[]` (empty array). Entity get/create/update returns `{ id: "..." }` (single object). Entity delete returns `{ ok: true }`.

**SDK source evidence:** `node_modules/@base44/sdk/dist/utils/axios-client.js`:
```javascript
interceptors.response.use((response) => {
    return response.data;  // Returns raw HTTP body, not axios wrapper
}, ...)
```

**SDK entity methods:** `node_modules/@base44/sdk/dist/modules/entities.js`:
- `list()` → GET `/apps/{appId}/entities/{entityName}` → returns raw array
- `filter()` → GET `/apps/{appId}/entities/{entityName}?q=...` → returns raw array
- `get(id)` → GET `/apps/{appId}/entities/{entityName}/{id}` → returns single object
- `create()` → POST `/apps/{appId}/entities/{entityName}` → returns single object
- `update(id)` → PUT `/apps/{appId}/entities/{entityName}/{id}` → returns single object
- `delete(id)` → DELETE `/apps/{appId}/entities/{entityName}/{id}` → returns object

---

## ENTITY LIST CONTRACT
**Raw array `[]`** — SDK interceptor returns `response.data` directly; consumers call `.filter()`, `.find()`, `for...of`.

## ENTITY FILTER CONTRACT
**Raw array `[]`** — same as list; filter sends `?q=...` query param but response shape is identical.

## UNKNOWN ENTITY 599 TEST
Added: `test("unknown entity returns 599 UNMOCKED_API_PATH")` — verifies 599 status and error body.

## UNKNOWN FUNCTION 599 TEST
Added: `test("unknown function returns 599 UNMOCKED_API_PATH")` — verifies 599 status and error body.

## BASE44CLIENT MODULE TEST
Passing: `test("regression: /src/api/base44Client.js is never mocked")` — verifies `content-type: application/javascript`, never `application/json`.

---

## DESKTOP

**Pre-contract-fix result (operator run at SHA 13b62ca):**
- Functional: 7/9 PASS (leads, pricing, appointments failed)
- Visual: 7/9 PASS (public-landing, leads failed)
- Module regression: 1/1 PASS
- **Total: 14/19 PASS, 5/19 FAIL**

**Post-contract-fix expected:**
- Functional: 9/9 PASS (contract fix resolves leads.filter, rules.find, appts iterable)
- Module regression: 1/1 PASS
- Contract regression: 7/7 PASS (new tests)
- Visual: pending rerun — leads visual should pass after contract fix; public-landing visual needs investigation
- **Total: 26 tests per project (9 load/error + 9 visual + 1 module + 7 contract)**

**Operator must rerun:**
```
npx playwright test --project=desktop-1440 --update-snapshots=none
```

## MOBILE

**Pre-contract-fix result (operator run):**
- Functional: 6/9 PASS (leads, pricing, appointments failed)
- Visual: 0/9 PASS (no approved mobile baselines exist — expected)
- Module regression: 1/1 PASS
- **Total: 7/19 PASS, 12/19 FAIL**

**Post-contract-fix expected:**
- Functional: 9/9 PASS (contract fix resolves all three functional failures)
- Module regression: 1/1 PASS
- Contract regression: 7/7 PASS (new tests)
- Visual: 0/9 (no baselines — PENDING OPERATOR VISUAL APPROVAL)
- **Total: 26 tests per project**

**Operator must rerun:**
```
npx playwright test --project=mobile-390 --update-snapshots=none
```

**After functional green:** render 9 screenshots at 390×844 into `test-results/mobile-review/` (gitignored). Return for operator review. Only explicit operator approval may promote them to snapshot baselines.

---

## PUBLIC LANDING VISUAL DIFF

| Field | Value |
|-------|-------|
| Route | `/` (public-landing) |
| Project | desktop-1440 |
| Pixel count different | 690,497 |
| Diff ratio | 0.44 (44%) |
| Expected baseline | `e2e/visual.spec.ts-snapshots/desktop-1440--public-landing.png` |
| Actual screenshot | COULD NOT CAPTURE — sandbox cannot run Playwright |
| Diff artifact | COULD NOT CAPTURE — sandbox cannot run Playwright |
| Visual differences observed | COULD NOT OBSERVE — sandbox cannot run Playwright |
| Baseline provenance | COULD NOT VERIFY — sandbox cannot access git history |
| Recommended disposition | **OPERATOR MUST INVESTIGATE** — compare: (A) current actual screenshot, (B) committed desktop baseline, (C) approved current visual source / live public rendering. Determine: BASELINE IS STALE/INVALID or CURRENT RENDER HAS UNAPPROVED VISUAL DRIFT. Do NOT update baseline without operator approval. |

**DO NOT UPDATE THE BASELINE.**

---

## LEADS VISUAL DIFF

| Field | Value |
|-------|-------|
| Route | `/leads` |
| Project | desktop-1440 |
| Pixel count different | 180,649 |
| Diff ratio | 0.12 (12%) |
| Status | **PENDING RERUN** — first repair the response contract (done this pass), then rerun. Do not evaluate baseline validity until the route renders without JavaScript errors. |

**Contract fix applied:** entity list/filter now returns raw `[]`. The `leads.filter is not a function` error should be resolved. Operator must rerun to verify.

---

## SECURITY
0 HIGH, 0 CRITICAL, 4 MODERATE ACCEPTED-RISK. Do NOT state "zero vulnerabilities."

## CI
**NOT ACTIVE.** `.github/workflows/ci.yml` absent. Draft updated with `--update-snapshots=none`. CI must fail on missing/differing baselines. NO `continue-on-error`.

## BRANCH PROTECTION
**DISABLED.** main not protected, 0 required status checks.

## VISUAL CHANGES
**NONE.** No application visuals altered.

---

## ALLOWLIST COUNT

| Category | Count |
|----------|-------|
| Known entities | 90 |
| Known functions | 32 |

---

## FAIL-CLOSED BEHAVIOR (PRESERVED)

- `pathname.startsWith("/api/")` — no substring matching
- `page.context().route()` — browser-context routing
- `serviceWorkers: "block"` — in playwright.config.ts
- 599 `UNMOCKED_API_PATH` for unknown entities/functions
- `--update-snapshots=none` — in CI draft

---

## TWILIO SECRET STORAGE

**Classification: RLS CONFIGURED / FUNCTIONAL / NEEDS SECRET-STORAGE HARDENING**

RLS enforces admin-only CRUD. No credential statically bundled. But `twilio_auth_token` reaches browser React state when admin views `/admin` via `IntegrationConfig.filter`. Preferred: platform secret storage. Do NOT migrate without operator approval.

---

## OPERATOR APPROVAL REQUIRED

| # | Item | Action |
|---|------|--------|
| 1 | Post-correction validation | `npm run lint && npm run typecheck && npm test && npm run build && npm audit --omit=dev --audit-level=high` |
| 2 | Git hygiene | `git status --porcelain` — verify only expected files changed |
| 3 | Desktop E2E | `npx playwright test --project=desktop-1440 --update-snapshots=none` — required 9/9 functional + 1/1 module + 7/7 contract |
| 4 | Mobile functional E2E | `npx playwright test --project=mobile-390 --update-snapshots=none` — required 9/9 functional + 1/1 module + 7/7 contract |
| 5 | Mobile visual baselines | Render at 390×844 into gitignored review dir, submit for approval |
| 6 | Public landing visual diff | Investigate baseline provenance, determine stale vs drift, report disposition |
| 7 | CI pipeline | Create `.github/workflows/ci.yml` from `ci-workflow-draft.yml` |
| 8 | Branch protection | Enable on main (requires approval) |
| 9 | Twilio stale URL | Replace in `Admin.jsx` and `VoiceAssistant.jsx` |
| 10 | OAuth connectors | Connect Gmail, Google Calendar, Google Drive via `/admin` |
| 11 | Twilio carrier verification | Submit via Twilio console |
| 12 | Twilio secret storage | Migrate auth token to platform secrets (requires approval) |

---

VERIFIED: Core gates at SHA 13b62ca (lint, typecheck, 53/53 tests, build, security). Mock contract root cause (SDK interceptor returns response.data directly). Mock contract fix (raw array for list/filter). 7 response contract regression tests added. 90 known entities, 32 known functions. Fail-closed behavior preserved. Twilio secret storage classification corrected.

INFERRED: Desktop pre-fix result (14/19). Mobile pre-fix result (7/19). Public landing visual diff (44%, 690497 pixels). Leads visual diff (12%, 180649 pixels).

COULD NOT VERIFY: Post-correction SHA, tree SHA, git status, post-fix E2E results, public landing baseline provenance, actual screenshots, diff artifacts.

BLOCKERS: git/npm/playwright commands timeout in degraded sandbox. Cannot run browser validation. Cannot access git history. `.github/workflows/` writes blocked by platform.

WORKAROUNDS: Operator runs all validation locally with `--update-snapshots=none`. Operator investigates public landing visual diff. Operator renders mobile baselines into gitignored review dir for approval. Operator creates CI workflow manually.

NEXT ACTIONS:
1. Operator: `git status --porcelain` → verify only 3 expected files changed
2. Operator: `npm run lint && npm run typecheck && npm test && npm run build && npm audit --omit=dev --audit-level=high`
3. Operator: `npx playwright test --project=desktop-1440 --update-snapshots=none` → 9/9 functional + 1/1 module + 7/7 contract + visual results
4. Operator: `npx playwright test --project=mobile-390 --update-snapshots=none` → 9/9 functional + 1/1 module + 7/7 contract
5. Operator: investigate public landing 44% visual diff — compare actual, baseline, live source
6. Operator: render mobile screenshots into `test-results/mobile-review/`, submit for review
7. Operator: create `.github/workflows/ci.yml`
8. Operator: enable branch protection
9. Operator: replace stale Twilio URLs
10. Operator: connect OAuth connectors
11. Operator: submit Twilio carrier verification
12. Operator: record final post-correction SHA