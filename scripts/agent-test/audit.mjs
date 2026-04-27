// Loop-1 full screen audit. Walks each major SPA screen, captures screenshots
// at 375 + 768 + 1440, runs axe-core a11y, captures console errors + 4xx.
// Writes a JSON report at scripts/agent-test/audit-report.json that loop 1
// reads to populate BUGS.md.
//
// No backend auth needed — we force each screen visible via class toggle.
// Data won't load (no auth token) but layout/empty states/typography do.

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = path.resolve("scripts/agent-test/screenshots");
const REPORT = path.resolve("scripts/agent-test/audit-report.json");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Subset of screens worth auditing visually. Sub-screens of the same flow
// are skipped to keep the audit cheap.
const SCREENS = [
  { id: "screen-auth",            label: "auth (login/register)" },
  { id: "screen-dashboard",       label: "dashboard" },
  { id: "screen-mode-vocab",      label: "vocab mode page" },
  { id: "screen-mode-grammar",    label: "grammar mode page" },
  { id: "screen-mode-reading",    label: "reading mode page" },
  { id: "screen-mode-writing",    label: "writing mode page" },
  { id: "screen-exercise",        label: "exercise (vocab MC)" },
  { id: "screen-grammar",         label: "grammar drill" },
  { id: "screen-reading",         label: "reading task" },
  { id: "screen-writing",         label: "writing task" },
  { id: "screen-writing-feedback",label: "writing feedback" },
  { id: "screen-results",         label: "vocab results" },
  { id: "screen-grammar-results", label: "grammar results" },
  { id: "screen-reading-results", label: "reading results" },
  { id: "screen-settings",        label: "settings" },
  { id: "screen-pro-upsell",      label: "pro upsell" },
  { id: "screen-ob-welcome",      label: "onboarding welcome" },
  { id: "screen-ob-personalize",  label: "onboarding personalize" },
  { id: "screen-ob-goal",         label: "onboarding goal" },
  { id: "screen-ob-path",         label: "onboarding path" },
  { id: "screen-placement-test",  label: "placement test" },
  { id: "screen-placement-results", label: "placement results" },
  { id: "screen-path",            label: "learning path" },
];

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768",  width: 768,  height: 1024 },
  { name: "375",  width: 375,  height: 812 },
];

const report = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  landing: {},
  app: {},
};

const browser = await chromium.launch();

async function auditPage(ctx, label, url, screenSelector) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => failedRequests.push(r.url() + " — " + (r.failure()?.errorText || "?")));
  page.on("response", (r) => { if (r.status() >= 400) failedRequests.push(r.url() + " HTTP " + r.status()); });

  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(800);

  // For app.html, force the target screen visible
  if (screenSelector) {
    await page.evaluate((sel) => {
      document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
      const t = document.getElementById(sel);
      if (t) t.classList.add("active");
      // also hide loading/auth gates in case they're stacked
      const loading = document.getElementById("screen-loading");
      if (loading) loading.classList.remove("active");
    }, screenSelector);
    await page.waitForTimeout(300);
  }

  // Axe a11y scan, scoped to active screen if we have one (otherwise full doc)
  let axeViolations = [];
  try {
    const axe = new AxeBuilder({ page });
    if (screenSelector) axe.include(`#${screenSelector}`);
    const results = await axe.analyze();
    axeViolations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes[0]?.html?.slice(0, 200),
    }));
  } catch (e) {
    axeViolations = [{ id: "axe-failed", impact: "n/a", help: e.message, nodes: 0 }];
  }

  return { consoleErrors, failedRequests, axeViolations };
}

try {
  // 1) Landing page (across viewports)
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const slug = `loop-1-landing-${vp.name}`;
    const data = await auditPage(ctx, "landing", "/", null);
    const page = ctx.pages()[0];
    await page.screenshot({ path: path.join(OUT_DIR, slug + ".png"), fullPage: true });
    report.landing[vp.name] = data;
    await ctx.close();
  }

  // 2) Each SPA screen (across viewports)
  for (const scr of SCREENS) {
    report.app[scr.id] = { label: scr.label, viewports: {} };
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const slug = `loop-1-${scr.id}-${vp.name}`;
      const data = await auditPage(ctx, scr.label, "/app.html", scr.id);
      const page = ctx.pages()[0];
      await page.screenshot({ path: path.join(OUT_DIR, slug + ".png"), fullPage: true });
      report.app[scr.id].viewports[vp.name] = data;
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

// Compact summary to stdout
const totals = {
  landingErrors: Object.values(report.landing).reduce((n, v) => n + v.consoleErrors.length, 0),
  appErrors: Object.values(report.app).reduce((n, s) =>
    n + Object.values(s.viewports).reduce((m, v) => m + v.consoleErrors.length, 0), 0),
  totalAxe: Object.values(report.app).reduce((n, s) =>
    n + Object.values(s.viewports).reduce((m, v) => m + v.axeViolations.length, 0),
    Object.values(report.landing).reduce((n, v) => n + v.axeViolations.length, 0)),
};
console.log(`Audit done. Screens: ${SCREENS.length}, viewports: ${VIEWPORTS.length}.`);
console.log(`Console errors — landing: ${totals.landingErrors}, app: ${totals.appErrors}`);
console.log(`Axe violations total: ${totals.totalAxe}`);
console.log(`Report: ${REPORT}`);
