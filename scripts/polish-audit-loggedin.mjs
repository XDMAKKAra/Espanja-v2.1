// L-V321 logged-in polish audit — scans every authenticated app surface,
// collects axe violations, console errors, network errors, touch-target
// failures, LCP/CLS metrics for screens the L-V320 audit couldn't reach.
//
// Reuses login flow from tests/e2e-bug-scan.spec.js (commit 091d).
//
// Run: AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-loggedin.mjs
// Requires: TEST_LOGIN_EMAIL + TEST_LOGIN_PASSWORD in .env (Pro test account).

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

// Load .env without bringing in dotenv as a dep
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(REPO, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

const EMAIL = process.env.TEST_LOGIN_EMAIL;
const PW = process.env.TEST_LOGIN_PASSWORD;
if (!EMAIL || !PW) {
  console.error("FATAL: TEST_LOGIN_EMAIL + TEST_LOGIN_PASSWORD must be set in .env");
  process.exit(1);
}

const BASE = process.env.AUDIT_BASE_URL || "https://espanja-v2-1.vercel.app";
const TODAY = "2026-05-26";
const OUT_DIR = join(REPO, "screenshots", `polish-audit-loggedin-${TODAY}`);
const AUDITS_DIR = join(REPO, "docs", "audits");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(AUDITS_DIR, { recursive: true });

// Surfaces reachable only after auth. Hash routes per bug-scan-spec naming.
const PAGES = [
  { slug: "l01-home", hash: "#/koti" },
  { slug: "l02-profile", hash: "#/profiili" },
  { slug: "l03-settings", hash: "#/asetukset" },
  { slug: "l04-vocab", hash: "#/sanasto" },
  { slug: "l05-grammar", hash: "#/kielioppi" },
  { slug: "l06-reading", hash: "#/lukeminen" },
  { slug: "l07-writing", hash: "#/kirjoittaminen" },
  { slug: "l08-results", hash: "#/tulokset" },
  { slug: "l09-path", hash: "#/oppimispolku" },
  { slug: "l10-curriculum", hash: "#/kurssit" },
  { slug: "l11-exam", hash: "#/koe" },
  { slug: "l12-dashboard", hash: "#/" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];

const AXE_CDN = "https://cdn.jsdelivr.net/npm/axe-core@4.8.2/axe.min.js";
const RESULTS = { run: TODAY, base: BASE, loggedIn: true, pages: [] };

async function injectAxe(page) {
  try {
    await page.addScriptTag({ url: AXE_CDN });
    await page.waitForFunction(() => typeof window.axe !== "undefined", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function runAxe(page) {
  return await page.evaluate(async () => {
    if (typeof window.axe === "undefined") return { violations: [] };
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
      resultTypes: ["violations"],
    });
    return {
      violations: r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => ({
          target: n.target.join(" "),
          html: n.html.slice(0, 200),
          failureSummary: n.failureSummary,
        })),
        nodeCount: v.nodes.length,
      })),
    };
  });
}

async function checkTouchTargets(page) {
  return await page.evaluate(() => {
    const sels = ["button", "a[href]", '[role="button"]', "input:not([type=hidden])", "select", "textarea"];
    const interactive = Array.from(document.querySelectorAll(sels.join(",")));
    const bad = [];
    for (const el of interactive) {
      if (!el.offsetParent && el.tagName !== "INPUT") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        const sel = el.id ? `#${el.id}` : el.className && typeof el.className === "string"
          ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : el.tagName.toLowerCase();
        bad.push({ selector: sel.slice(0, 80), width: Math.round(r.width), height: Math.round(r.height), text: (el.textContent || "").trim().slice(0, 40) });
      }
    }
    return bad.slice(0, 50);
  });
}

async function getMetrics(page) {
  return await page.evaluate(() => new Promise((resolve) => {
    const metrics = { lcp: null, cls: null };
    let clsTotal = 0;
    try {
      new PerformanceObserver((list) => { for (const e of list.getEntries()) metrics.lcp = Math.round(e.startTime); }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) clsTotal += e.value; metrics.cls = Math.round(clsTotal * 1000) / 1000; }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    setTimeout(() => resolve(metrics), 3000);
  }));
}

async function loginCtx(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.ua,
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 30000 });

  // Click login tab if it exists (some flows default to login already)
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) {
    try { await loginTab.click({ timeout: 3000 }); } catch {}
  }

  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PW);

  const submitBtn = page.locator("#btn-auth-submit");
  await submitBtn.scrollIntoViewIfNeeded();
  const [loginRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/") && r.request().method() === "POST", { timeout: 15000 }),
    submitBtn.click({ force: true }),
  ]);
  const loginStatus = loginRes.status();
  if (loginStatus >= 400) {
    throw new Error(`Login failed: ${loginStatus} ${loginRes.url()}`);
  }
  // Wait for home to mount
  await page.waitForTimeout(1500);
  return { ctx, page };
}

async function auditLoggedIn(page, pageInfo, viewport) {
  const consoleErrors = [];
  const networkErrors = [];
  const handler = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 240)); };
  const respHandler = (res) => { if (res.status() >= 400 && !res.url().includes("favicon")) networkErrors.push(`${res.status()} ${res.url().slice(0, 200)}`); };
  const errHandler = (err) => consoleErrors.push(`UNCAUGHT: ${err.message.slice(0, 240)}`);
  page.on("console", handler);
  page.on("response", respHandler);
  page.on("pageerror", errHandler);

  let status = "ok";
  let axeResult = { violations: [] };
  let touchTargets = [];
  let metrics = { lcp: null, cls: null };

  try {
    await page.goto(BASE + "/app.html" + pageInfo.hash, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    metrics = await getMetrics(page);
    const axeOk = await injectAxe(page);
    if (axeOk) axeResult = await runAxe(page);
    touchTargets = await checkTouchTargets(page);
    const screenshotPath = join(OUT_DIR, `${pageInfo.slug}-${viewport.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (err) {
    status = `error: ${err.message.slice(0, 160)}`;
  }

  page.off("console", handler);
  page.off("response", respHandler);
  page.off("pageerror", errHandler);

  return {
    slug: pageInfo.slug,
    hash: pageInfo.hash,
    device: viewport.name,
    status,
    consoleErrors,
    networkErrors,
    axeViolations: axeResult.violations,
    touchTargetFailures: touchTargets,
    metrics,
  };
}

(async () => {
  console.log(`Logged-in audit · base=${BASE} · email=${EMAIL} · ${PAGES.length} pages × ${VIEWPORTS.length} viewports`);
  const browser = await chromium.launch();

  for (const v of VIEWPORTS) {
    console.log(`\n--- viewport: ${v.name} ---`);
    let ctx, page;
    try {
      const r = await loginCtx(browser, v);
      ctx = r.ctx;
      page = r.page;
      console.log(`  logged in as ${EMAIL}`);
    } catch (err) {
      console.error(`  LOGIN FAILED: ${err.message}`);
      continue;
    }

    let idx = 0;
    for (const p of PAGES) {
      idx++;
      const start = Date.now();
      const result = await auditLoggedIn(page, p, v);
      const dur = ((Date.now() - start) / 1000).toFixed(1);
      const flags = `axe=${result.axeViolations.length} cons=${result.consoleErrors.length} net=${result.networkErrors.length} tt=${result.touchTargetFailures.length}`;
      console.log(`  [${idx}/${PAGES.length}] ${result.slug} · ${result.status} · ${flags} · ${dur}s`);
      RESULTS.pages.push(result);
    }
    await ctx.close();
  }

  await browser.close();

  // Write JSON
  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit-loggedin.json`), JSON.stringify(RESULTS, null, 2), "utf-8");

  // Aggregate
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const byRule = {};
  let consoleErrTotal = 0, netErrTotal = 0, ttTotal = 0, pagesWithErr = 0;
  for (const p of RESULTS.pages) {
    if (p.consoleErrors.length || p.networkErrors.length) pagesWithErr++;
    consoleErrTotal += p.consoleErrors.length;
    netErrTotal += p.networkErrors.length;
    ttTotal += p.touchTargetFailures.length;
    for (const v of p.axeViolations) {
      byImpact[v.impact] = (byImpact[v.impact] || 0) + v.nodeCount;
      byRule[v.id] = (byRule[v.id] || 0) + v.nodeCount;
    }
  }

  const top = Object.entries(byRule).sort(([, a], [, b]) => b - a).slice(0, 15);
  const md = `# L-V321 logged-in polish audit · ${TODAY}

**Base:** ${BASE}
**Account:** ${EMAIL} (Pro test)
**Surfaces scanned:** ${PAGES.length} (desktop + mobile = ${PAGES.length * 2} pages)
**Screenshots:** \`screenshots/polish-audit-loggedin-${TODAY}/\`
**Full data:** \`docs/audits/${TODAY}-polish-audit-loggedin.json\`

## Headline numbers

| Bucket | Count |
|---|---|
| Critical a11y violations | ${byImpact.critical || 0} |
| Serious a11y violations | ${byImpact.serious || 0} |
| Moderate a11y violations | ${byImpact.moderate || 0} |
| Minor a11y violations | ${byImpact.minor || 0} |
| Console errors (across all pages) | ${consoleErrTotal} |
| Network errors ≥400 | ${netErrTotal} |
| Touch targets <44 px (mobile) | ${ttTotal} |
| Pages with at least one error | ${pagesWithErr} / ${PAGES.length * 2} |

## Top 15 a11y rules by node count

${top.map(([rule, n]) => `- **${rule}** — ${n} nodes`).join("\n") || "_(no axe data — check whether axe loaded)_"}

## Per-page summary

| Page | Device | Status | Axe | Console | Network | TT<44 | LCP | CLS |
|---|---|---|---|---|---|---|---|---|
${RESULTS.pages.map((p) => {
  const axeCount = p.axeViolations.reduce((s, v) => s + v.nodeCount, 0);
  return `| ${p.slug} | ${p.device} | ${p.status} | ${axeCount} | ${p.consoleErrors.length} | ${p.networkErrors.length} | ${p.touchTargetFailures.length} | ${p.metrics.lcp ?? "—"} | ${p.metrics.cls ?? "—"} |`;
}).join("\n")}

## Pages with console errors

${RESULTS.pages.filter((p) => p.consoleErrors.length).slice(0, 8).map(
  (p) => `### ${p.slug} (${p.device})\n\n` + p.consoleErrors.slice(0, 3).map((e) => `- \`${e}\``).join("\n"),
).join("\n\n") || "_(none)_"}

## Pages with network errors

${RESULTS.pages.filter((p) => p.networkErrors.length).slice(0, 8).map(
  (p) => `### ${p.slug} (${p.device})\n\n` + p.networkErrors.slice(0, 3).map((e) => `- \`${e}\``).join("\n"),
).join("\n\n") || "_(none)_"}
`;
  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit-loggedin.md`), md, "utf-8");

  console.log("\nWrote:");
  console.log(`  ${AUDITS_DIR}/${TODAY}-polish-audit-loggedin.json`);
  console.log(`  ${AUDITS_DIR}/${TODAY}-polish-audit-loggedin.md`);
  console.log(`  ${OUT_DIR}/`);
  console.log(`\nHeadlines: ${byImpact.critical || 0} critical · ${byImpact.serious || 0} serious · ${byImpact.moderate || 0} moderate · ${byImpact.minor || 0} minor · ${consoleErrTotal} console · ${netErrTotal} net · ${ttTotal} tt<44`);
})();
