import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, ".validation");
fs.mkdirSync(OUT, { recursive: true });

const policy = JSON.parse(fs.readFileSync(path.join(ROOT, "validation-score-policy.json"), "utf8"));
const startedAt = new Date().toISOString();

function run(id, command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: options.timeout ?? 600000,
    env: { ...process.env, CI: "true", ...(options.env || {}) },
  });
  const receipt = {
    id,
    command: [command, ...args].join(" "),
    exitCode: result.status,
    signal: result.signal,
    durationMs: Date.now() - started,
    passed: result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
  fs.writeFileSync(path.join(OUT, `${id}.log`), `${receipt.stdout}\n${receipt.stderr}`);
  return receipt;
}

function gitValue(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? (r.stdout || "").trim() : "";
}

function flattenSpecs(suites, ancestry = [], out = []) {
  for (const suite of suites || []) {
    const next = [...ancestry, suite.title || ""].filter(Boolean);
    for (const spec of suite.specs || []) {
      out.push({ ancestry: next, title: spec.title || "", ok: spec.ok === true, tests: spec.tests || [] });
    }
    flattenSpecs(suite.suites || [], next, out);
  }
  return out;
}

function parsePlaywrightJson(text) {
  try {
    const report = JSON.parse(text);
    const specs = flattenSpecs(report.suites || []);
    const functional = specs.filter((s) => s.title === "loads and renders without uncaught errors");
    const visual = specs.filter((s) => s.title === "matches visual baseline");
    const moduleRegression = specs.filter((s) => s.title.startsWith("regression: /src/api/base44Client.js"));
    const contract = specs.filter((s) => s.ancestry.includes("mock response contract"));
    return {
      parsed: true,
      totalSpecs: specs.length,
      functionalPassed: functional.filter((s) => s.ok).length,
      functionalTotal: functional.length,
      visualPassed: visual.filter((s) => s.ok).length,
      visualTotal: visual.length,
      modulePassed: moduleRegression.filter((s) => s.ok).length,
      moduleTotal: moduleRegression.length,
      contractPassed: contract.filter((s) => s.ok).length,
      contractTotal: contract.length,
      reportErrors: report.errors || [],
    };
  } catch (error) {
    return { parsed: false, error: String(error) };
  }
}

function readReview(name) {
  const file = path.join(OUT, `review-${name}.json`);
  if (!fs.existsSync(file)) return { exists: false, records: [], publicLandingVsHomeDistinct: null };
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    // Support both legacy array format and new object format with records + metadata
    const records = Array.isArray(raw) ? raw : (raw.records || []);
    const publicLandingVsHomeDistinct = Array.isArray(raw) ? null : raw.publicLandingVsHomeDistinct;
    return { exists: true, records, publicLandingVsHomeDistinct };
  } catch (error) {
    return { exists: true, records: [], publicLandingVsHomeDistinct: null, error: String(error) };
  }
}

const before = {
  sha: gitValue(["rev-parse", "HEAD"]),
  tree: gitValue(["rev-parse", "HEAD^{tree}"]),
  status: gitValue(["status", "--porcelain"]),
};

const receipts = [];
receipts.push(run("npm-ci", "npm", ["ci"]));
receipts.push(run("lint", "npm", ["run", "lint"]));
receipts.push(run("typecheck", "npm", ["run", "typecheck"]));
receipts.push(run("unit-tests", "npm", ["test"]));
receipts.push(run("payment-regression", "npx", ["vitest", "run", "tests/payments.test.ts"]));
receipts.push(run("build", "npm", ["run", "build"]));
receipts.push(run("audit-high", "npm", ["audit", "--omit=dev", "--audit-level=high"]));

let desktopRun = run("playwright-desktop", "npx", ["playwright", "test", "--project=desktop-1440", "--update-snapshots=none", "--reporter=json"]);
if ((desktopRun.stderr + desktopRun.stdout).includes("Executable doesn't exist")) {
  receipts.push(run("playwright-install", "npx", ["playwright", "install", "--with-deps", "chromium"], { timeout: 600000 }));
  desktopRun = run("playwright-desktop-retry", "npx", ["playwright", "test", "--project=desktop-1440", "--update-snapshots=none", "--reporter=json"]);
}
receipts.push(desktopRun);

let mobileRun = run("playwright-mobile", "npx", ["playwright", "test", "--project=mobile-390", "--update-snapshots=none", "--reporter=json"]);
if ((mobileRun.stderr + mobileRun.stdout).includes("Executable doesn't exist")) {
  if (!receipts.some((r) => r.id === "playwright-install")) receipts.push(run("playwright-install", "npx", ["playwright", "install", "--with-deps", "chromium"], { timeout: 600000 }));
  mobileRun = run("playwright-mobile-retry", "npx", ["playwright", "test", "--project=mobile-390", "--update-snapshots=none", "--reporter=json"]);
}
receipts.push(mobileRun);

const reviewRun = run("review-capture", "npx", ["playwright", "test", "--config=playwright.review.config.ts", "--update-snapshots=none"], { timeout: 600000 });
receipts.push(reviewRun);

const desktop = parsePlaywrightJson(desktopRun.stdout);
const mobile = parsePlaywrightJson(mobileRun.stdout);
const reviewDesktop = readReview("desktop");
const reviewMobile = readReview("mobile");
const reviewRecords = [...reviewDesktop.records, ...reviewMobile.records];
// A capture is valid only if BOTH functional health AND route identity pass.
// A screenshot that renders the wrong page must NEVER receive a passing score.
const reviewValid =
  reviewRecords.length === 12 &&
  reviewRecords.every((r) => r.functionalResult === "PASS" && r.routeIdentityResult === "PASS");
const publicLandingVsHomeDistinct = reviewMobile.publicLandingVsHomeDistinct === true;

const after = {
  sha: gitValue(["rev-parse", "HEAD"]),
  tree: gitValue(["rev-parse", "HEAD^{tree}"]),
  status: gitValue(["status", "--porcelain"]),
};

const receiptMap = Object.fromEntries(receipts.map((r) => [r.id, r]));
function receiptPass(...ids) {
  return ids.some((id) => receiptMap[id]?.passed);
}

const gatePass = {
  git_integrity: !!before.sha && before.sha === after.sha && before.tree === after.tree && after.status === "",
  npm_ci: receiptPass("npm-ci"),
  lint: receiptPass("lint"),
  typecheck: receiptPass("typecheck"),
  unit_tests: receiptPass("unit-tests"),
  payment_regression: receiptPass("payment-regression"),
  build: receiptPass("build"),
  audit_high: receiptPass("audit-high"),
  desktop_functional: desktop.parsed && desktop.functionalPassed === 9 && desktop.functionalTotal === 9,
  mobile_functional: mobile.parsed && mobile.functionalPassed === 9 && mobile.functionalTotal === 9,
  module_regression: desktop.parsed && mobile.parsed && desktop.modulePassed === 1 && desktop.moduleTotal === 1 && mobile.modulePassed === 1 && mobile.moduleTotal === 1,
  contract_regression: desktop.parsed && mobile.parsed && desktop.contractPassed === 7 && desktop.contractTotal === 7 && mobile.contractPassed === 7 && mobile.contractTotal === 7,
  review_capture_integrity: reviewRun.passed && reviewValid && publicLandingVsHomeDistinct,
  receipt_integrity: receipts.every((r) => typeof r.exitCode === "number" || r.signal) && !!before.sha && !!after.sha,
};

const gates = policy.scored_gates.map((gate) => ({ ...gate, passed: !!gatePass[gate.id] }));
const score = gates.reduce((total, gate) => total + (gate.passed ? gate.weight : 0), 0);
const failedGates = gates.filter((gate) => !gate.passed).map((gate) => gate.id);
const state = score === 100 && failedGates.length === 0 ? "AUTONOMOUS_COMPLETE" : "AUTONOMOUS_WORK_REMAINS";

const report = {
  version: "1.0.0",
  startedAt,
  finishedAt: new Date().toISOString(),
  state,
  score,
  target: policy.score_target,
  before,
  after,
  gates,
  failedGates,
  browser: {
    desktop,
    mobile,
    reviewDesktopCount: reviewDesktop.records.length,
    reviewMobileCount: reviewMobile.records.length,
    reviewValid,
    publicLandingVsHomeDistinct,
  },
  protectedReleaseGates: policy.unscored_protected_release_gates.map((id) => ({ id, status: "WAITING_APPROVAL_OR_EXTERNAL" })),
  receipts: receipts.map(({ stdout, stderr, ...receipt }) => receipt),
  rule: policy.completion_rule,
};

fs.writeFileSync(path.join(OUT, "current-score.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(OUT, `receipt-${Date.now()}.json`), JSON.stringify(report, null, 2));

console.log(JSON.stringify({
  state: report.state,
  score: report.score,
  target: report.target,
  sha: after.sha,
  tree: after.tree,
  clean: after.status === "",
  failedGates: report.failedGates,
  desktop: report.browser.desktop,
  mobile: report.browser.mobile,
  reviewValid: report.browser.reviewValid,
  protectedReleaseGates: report.protectedReleaseGates,
}, null, 2));

process.exit(state === "AUTONOMOUS_COMPLETE" ? 0 : 2);