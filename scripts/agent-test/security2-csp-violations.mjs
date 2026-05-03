// L-SECURITY-3 — CSP-Report-Only violation scanner.
//
// Walks 7 user-flow surfaces against a deployed URL, captures every
// CSP violation (browser SecurityPolicyViolationEvent + console output),
// dedupes by {directive, blocked-uri}, and prints a summary that names
// every origin we'd need to add to vercel.json's CSP.
//
// Env:
//   BASE_URL                  — e.g. https://espanja-v2-1.vercel.app   (required)
//   VERCEL_BYPASS_TOKEN       — optional; sent as x-vercel-protection-bypass
//                               on every request, lets us hit SSO-gated
//                               preview deployments. Get one from Vercel
//                               dashboard → Project → Settings →
//                               Deployment Protection → Protection Bypass
//                               for Automation.
//   TEST_EMAIL / TEST_PASSWORD — optional; if both set, the script also
//                               logs in and walks the auth-gated flows
//                               (vocab / grammar / writing / dashboard /
//                                email settings). Without them, we still
//                               surface the script-src / connect-src
//                               violations triggered by page load.
//
// Exit: 0 if zero unique violations, 1 if any.

import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "").replace(/\/$/, "");
const BYPASS = process.env.VERCEL_BYPASS_TOKEN || "";
const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

if (!BASE) {
  console.error("ERROR: BASE_URL env var is required (e.g. BASE_URL=https://espanja-v2-1.vercel.app)");
  process.exit(2);
}

const violations = [];
const seenKeys = new Set();

function recordViolation(v) {
  const key = `${v.directive || "?"}|${v.blockedURI || v.raw || "?"}`;
  if (seenKeys.has(key)) return;
  seenKeys.add(key);
  violations.push(v);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  serviceWorkers: "block",
  ignoreHTTPSErrors: true,
  extraHTTPHeaders: BYPASS ? { "x-vercel-protection-bypass": BYPASS } : undefined,
});

// ── Init script: bypass pre-launch gate + listen to in-page CSP events ────
await ctx.addInitScript(() => {
  try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  document.addEventListener("securitypolicyviolation", (e) => {
    const payload = {
      type: "csp-violation",
      directive: e.violatedDirective || e.effectiveDirective || null,
      blockedURI: e.blockedURI || null,
      sourceFile: e.sourceFile || null,
      line: e.lineNumber || null,
      column: e.columnNumber || null,
      sample: (e.sample || "").slice(0, 120),
      docURL: location.href,
      disposition: e.disposition || null,
    };
    console.warn("[CSP-VIOLATION]" + JSON.stringify(payload));
  });
});

const page = await ctx.newPage();

// Informational CSP messages that are not actionable violations:
//   • "directive 'X' is ignored when delivered in a report-only policy"
//     — fires for upgrade-insecure-requests / sandbox in Report-Only.
//     Disappears the moment Report-Only flips to enforcing.
const CSP_NOISE = [
  /ignored when delivered in a report-only/i,
  /ignored when delivered via/i,
];

page.on("console", (msg) => {
  const txt = msg.text();
  // Our SecurityPolicyViolationEvent re-emit
  if (txt.startsWith("[CSP-VIOLATION]")) {
    try { recordViolation(JSON.parse(txt.slice("[CSP-VIOLATION]".length))); }
    catch { /* ignore parse error */ }
    return;
  }
  // Some browsers also log a native message before the event fires; capture
  // anything that mentions CSP so we don't miss edge cases.
  if (msg.type() === "error" && /Content Security Policy|Content-Security-Policy|violates the .* directive/i.test(txt)) {
    if (CSP_NOISE.some((re) => re.test(txt))) return;
    recordViolation({ raw: txt.slice(0, 400), via: "console", url: msg.location()?.url || null });
  }
});

page.on("pageerror", (err) => {
  if (/Content Security Policy/i.test(err.message)) {
    recordViolation({ raw: err.message.slice(0, 400), via: "pageerror" });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────
async function goto(url, { wait = 2500, waitUntil = "networkidle" } = {}) {
  console.log(`  → ${url}`);
  try {
    await page.goto(url, { waitUntil, timeout: 30000 });
  } catch (e) {
    // Networkidle can time out on apps with persistent WS — fall back to dom.
    console.log(`     (networkidle timeout, retrying with domcontentloaded)`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  }
  await page.waitForTimeout(wait);
}

async function safeFill(selector, value) {
  try {
    const el = page.locator(selector).first();
    if (await el.count()) { await el.fill(value); return true; }
  } catch { /* ignore */ }
  return false;
}

async function safeClick(selector) {
  try {
    const el = page.locator(selector).first();
    if (await el.count()) { await el.click({ timeout: 3000 }); return true; }
  } catch { /* ignore */ }
  return false;
}

async function tryLogin() {
  if (!TEST_EMAIL || !TEST_PASSWORD) return false;
  await goto(BASE + "/app.html#kirjaudu", { wait: 2000 });
  // The auth screen lives inside #screen-auth — fields differ across redesigns,
  // so we try a few selector variants.
  const emailFilled =
    (await safeFill('input[type="email"]', TEST_EMAIL)) ||
    (await safeFill('input[name="email"]', TEST_EMAIL)) ||
    (await safeFill("#login-email", TEST_EMAIL));
  const passFilled =
    (await safeFill('input[type="password"]', TEST_PASSWORD)) ||
    (await safeFill('input[name="password"]', TEST_PASSWORD)) ||
    (await safeFill("#login-password", TEST_PASSWORD));
  if (!emailFilled || !passFilled) {
    console.log("     login fields not found — skipping auth-gated flows");
    return false;
  }
  const submitted =
    (await safeClick('button[type="submit"]')) ||
    (await safeClick("#login-submit"));
  if (!submitted) return false;
  await page.waitForTimeout(3500);
  // Heuristic: dashboard renders if URL changes off #kirjaudu or main visible.
  const url = page.url();
  const ok = !url.includes("#kirjaudu");
  console.log(`     login ${ok ? "succeeded" : "did not appear to succeed"}`);
  return ok;
}

// ── Flows ─────────────────────────────────────────────────────────────────
const flows = [];

flows.push({
  name: "1-landing",
  run: async () => {
    await goto(BASE + "/", { wait: 2500 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
  },
});

flows.push({
  name: "2-register-onboarding",
  run: async () => {
    await goto(BASE + "/app.html#rekisteroidy", { wait: 3000, waitUntil: "domcontentloaded" });
    // Tap an OB1 pill if present so any reveal-on-interaction script-src is exercised.
    await safeClick('[data-target-grade="B"]');
    await page.waitForTimeout(800);
  },
});

flows.push({
  name: "3-app-root-loaded",
  run: async () => {
    await goto(BASE + "/app.html", { wait: 3000, waitUntil: "domcontentloaded" });
  },
});

// Auth-gated flows — only meaningful with real creds. If login fails we skip.
flows.push({
  name: "4-login-attempt",
  run: async () => {
    const ok = await tryLogin();
    if (!ok) console.log("     (no creds or login failed; skipping deeper flows)");
    return ok;
  },
});

flows.push({
  name: "5-vocab",
  guard: "loggedIn",
  run: async () => {
    await goto(BASE + "/app.html#sanasto", { wait: 4000, waitUntil: "domcontentloaded" });
    // Click first answer button if rendered
    await safeClick(".exercise__answer, .answer-option, button.option");
    await page.waitForTimeout(1500);
  },
});

flows.push({
  name: "6-grammar",
  guard: "loggedIn",
  run: async () => {
    await goto(BASE + "/app.html#kielioppi", { wait: 4000, waitUntil: "domcontentloaded" });
    await safeClick(".exercise__answer, .answer-option, button.option");
    await page.waitForTimeout(1500);
  },
});

flows.push({
  name: "7-writing",
  guard: "loggedIn",
  run: async () => {
    await goto(BASE + "/app.html#kirjoittaminen", { wait: 4000, waitUntil: "domcontentloaded" });
    await safeFill("textarea, [contenteditable='true']", "Hola, me llamo prueba.");
    await safeClick("button[type='submit'], .writing-submit, #writing-submit");
    await page.waitForTimeout(4000); // wait for OpenAI roundtrip if it fires
  },
});

flows.push({
  name: "8-dashboard",
  guard: "loggedIn",
  run: async () => {
    await goto(BASE + "/app.html#dashboard", { wait: 3500, waitUntil: "domcontentloaded" });
  },
});

flows.push({
  name: "9-email-settings",
  guard: "loggedIn",
  run: async () => {
    await goto(BASE + "/app.html#asetukset", { wait: 3000, waitUntil: "domcontentloaded" });
  },
});

// ── Run ───────────────────────────────────────────────────────────────────
console.log(`\n=== CSP-violation scanner ===`);
console.log(`BASE_URL: ${BASE}`);
console.log(`Vercel bypass token: ${BYPASS ? "set" : "not set"}`);
console.log(`Test creds: ${TEST_EMAIL && TEST_PASSWORD ? "set" : "not set (auth-gated flows will be skipped)"}`);

let loggedIn = false;
for (const f of flows) {
  if (f.guard === "loggedIn" && !loggedIn) {
    console.log(`\n[skip] ${f.name} — requires login`);
    continue;
  }
  console.log(`\n--- ${f.name} ---`);
  try {
    const result = await f.run();
    if (f.name === "4-login-attempt" && result === true) loggedIn = true;
  } catch (e) {
    console.warn(`     flow error: ${e.message}`);
  }
}

// ── Report ────────────────────────────────────────────────────────────────
console.log("\n=== CSP Violation Report ===");
console.log(`Total unique violations: ${violations.length}`);

const byDirective = {};
const originSet = new Set();
for (const v of violations) {
  const d = v.directive || "unknown";
  byDirective[d] = (byDirective[d] || 0) + 1;
  if (v.blockedURI && /^https?:/.test(v.blockedURI)) {
    try { originSet.add(new URL(v.blockedURI).origin); } catch {}
  }
}
if (Object.keys(byDirective).length) {
  console.log("\nBy directive:");
  for (const [d, n] of Object.entries(byDirective).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${d}: ${n}`);
  }
}
if (originSet.size) {
  console.log("\nOrigins to add to CSP (per directive — manual mapping):");
  for (const o of originSet) console.log(`  ${o}`);
}
if (violations.length) {
  console.log("\nDetails:");
  for (const v of violations.slice(0, 50)) {
    if (v.raw) console.log(`  • [${v.via}] ${v.raw}`);
    else console.log(`  • directive=${v.directive}  blocked=${v.blockedURI}  source=${v.sourceFile}:${v.line}  doc=${v.docURL}`);
  }
}

await browser.close();
process.exit(violations.length === 0 ? 0 : 1);
