// L-V320 polish audit — scans every public surface, collects axe violations,
// console errors, network errors, touch-target failures, LCP/CLS metrics.
//
// Run: node scripts/polish-audit.mjs
// Optionally override base: AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit.mjs
//
// Outputs:
//   docs/audits/2026-05-26-polish-audit.json — full findings
//   docs/audits/2026-05-26-polish-audit.md   — human-readable summary
//   screenshots/polish-audit-2026-05-26/<page>-<device>.png

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.AUDIT_BASE_URL || "https://espanja-v2-1.vercel.app";
const TODAY = "2026-05-26";
const OUT_DIR = join(REPO, "screenshots", `polish-audit-${TODAY}`);
const AUDITS_DIR = join(REPO, "docs", "audits");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(AUDITS_DIR, { recursive: true });

const PAGES = [
  { slug: "p01-index-hub", url: "/", needsGate: false },
  { slug: "p02-landing-es", url: "/espanja-yo-koe", needsGate: false },
  { slug: "p03-landing-de", url: "/saksan-yo-koe", needsGate: false },
  { slug: "p04-landing-fr", url: "/ranskan-yo-koe", needsGate: false },
  { slug: "p05-diagnose", url: "/diagnose.html", needsGate: false },
  { slug: "p06-pricing", url: "/pricing.html", needsGate: false },
  { slug: "p07-terms", url: "/terms.html", needsGate: false },
  { slug: "p08-privacy", url: "/privacy.html", needsGate: false },
  { slug: "p09-refund", url: "/refund.html", needsGate: false },
  { slug: "p10-blog-index", url: "/blog/", needsGate: false },
  { slug: "p11-app-shell-unauth", url: "/app.html", needsGate: true },
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];

// Use jsdelivr — unpkg blocked by site CSP (script-src 'self' cdn.jsdelivr.net browser.sentry-cdn.com)
const AXE_CDN = "https://cdn.jsdelivr.net/npm/axe-core@4.8.2/axe.min.js";
const RESULTS = { run: TODAY, base: BASE, pages: [] };

async function injectAxe(page) {
  try {
    await page.addScriptTag({ url: AXE_CDN });
    // Wait for axe to be available
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
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
      resultTypes: ["violations"],
    });
    return {
      violations: r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
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
    const sels = [
      "button",
      "a[href]",
      '[role="button"]',
      "input:not([type=hidden])",
      "select",
      "textarea",
    ];
    const interactive = Array.from(document.querySelectorAll(sels.join(",")));
    const bad = [];
    for (const el of interactive) {
      if (!el.offsetParent && el.tagName !== "INPUT") continue; // skip hidden
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        const sel =
          el.id
            ? `#${el.id}`
            : el.className && typeof el.className === "string"
            ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
            : el.tagName.toLowerCase();
        bad.push({
          selector: sel.slice(0, 80),
          width: Math.round(r.width),
          height: Math.round(r.height),
          text: (el.textContent || "").trim().slice(0, 40),
        });
      }
    }
    return bad.slice(0, 50);
  });
}

async function getMetrics(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics = { lcp: null, cls: null };
      let clsTotal = 0;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            metrics.lcp = Math.round(e.startTime);
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });

        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (!e.hadRecentInput) clsTotal += e.value;
          }
          metrics.cls = Math.round(clsTotal * 1000) / 1000;
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}
      setTimeout(() => resolve(metrics), 3000);
    });
  });
}

async function auditOne(browser, pageInfo, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.ua,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text().slice(0, 240));
    }
  });
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      networkErrors.push(`${res.status()} ${res.url().slice(0, 200)}`);
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`UNCAUGHT: ${err.message.slice(0, 240)}`);
  });

  // Always bypass pre-launch gate — landings also throw 'UNCAUGHT: gate' on mobile if the
  // gate prompt() runs before localStorage check. Set the flag for every surface.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
    } catch {}
  });

  let status = "ok";
  let axeResult = { violations: [] };
  let touchTargets = [];
  let metrics = { lcp: null, cls: null };

  try {
    const fullUrl = BASE + pageInfo.url;
    const resp = await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 30000 });
    if (!resp || resp.status() >= 400) {
      status = `goto-${resp ? resp.status() : "no-response"}`;
    } else {
      await page.waitForTimeout(500);
      metrics = await getMetrics(page);
      const axeOk = await injectAxe(page);
      if (axeOk) {
        axeResult = await runAxe(page);
      }
      touchTargets = await checkTouchTargets(page);
      const screenshotPath = join(OUT_DIR, `${pageInfo.slug}-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  } catch (err) {
    status = `error: ${err.message.slice(0, 160)}`;
  }

  await ctx.close();
  return {
    slug: pageInfo.slug,
    url: pageInfo.url,
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
  console.log(`Polish audit · base=${BASE} · ${PAGES.length} pages × ${VIEWPORTS.length} viewports`);
  const browser = await chromium.launch();
  let idx = 0;
  const total = PAGES.length * VIEWPORTS.length;
  for (const p of PAGES) {
    for (const v of VIEWPORTS) {
      idx++;
      const start = Date.now();
      const r = await auditOne(browser, p, v);
      const dur = ((Date.now() - start) / 1000).toFixed(1);
      const flags = `axe=${r.axeViolations.length} cons=${r.consoleErrors.length} net=${r.networkErrors.length} tt=${r.touchTargetFailures.length}`;
      console.log(`  [${idx}/${total}] ${r.slug} ${r.device} · ${r.status} · ${flags} · ${dur}s`);
      RESULTS.pages.push(r);
    }
  }
  await browser.close();

  // Write JSON
  writeFileSync(
    join(AUDITS_DIR, `${TODAY}-polish-audit.json`),
    JSON.stringify(RESULTS, null, 2),
    "utf-8",
  );

  // Aggregate summary
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const byRule = {};
  let consoleErrTotal = 0;
  let netErrTotal = 0;
  let ttTotal = 0;
  let pagesWithErr = 0;
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

  // Write markdown summary
  const top = Object.entries(byRule)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);
  const md = `# L-V320 polish audit · ${TODAY}

**Base:** ${BASE}
**Surfaces scanned:** ${PAGES.length} (desktop + mobile = ${PAGES.length * 2} pages)
**Screenshots:** \`screenshots/polish-audit-${TODAY}/\`
**Full data:** \`docs/audits/${TODAY}-polish-audit.json\`

## Headline numbers

| Bucket | Count |
|---|---|
| Critical a11y violations | ${byImpact.critical || 0} |
| Serious a11y violations | ${byImpact.serious || 0} |
| Moderate a11y violations | ${byImpact.moderate || 0} |
| Minor a11y violations | ${byImpact.minor || 0} |
| Console errors (across all pages) | ${consoleErrTotal} |
| Network errors ≥400 (across all pages) | ${netErrTotal} |
| Touch targets <44 px (mobile) | ${ttTotal} |
| Pages with at least one error | ${pagesWithErr} / ${PAGES.length * 2} |

## Top 15 a11y rules by node count

${top.map(([rule, n]) => `- **${rule}** — ${n} nodes`).join("\n")}

## Per-page summary

| Page | Device | Status | Axe | Console | Network | TT<44 | LCP | CLS |
|---|---|---|---|---|---|---|---|---|
${RESULTS.pages
  .map((p) => {
    const axeCount = p.axeViolations.reduce((s, v) => s + v.nodeCount, 0);
    return `| ${p.slug} | ${p.device} | ${p.status} | ${axeCount} | ${p.consoleErrors.length} | ${p.networkErrors.length} | ${p.touchTargetFailures.length} | ${p.metrics.lcp ?? "—"} | ${p.metrics.cls ?? "—"} |`;
  })
  .join("\n")}

## Pages with console errors (top 5)

${RESULTS.pages
  .filter((p) => p.consoleErrors.length)
  .slice(0, 5)
  .map(
    (p) =>
      `### ${p.slug} (${p.device})\n\n` +
      p.consoleErrors.slice(0, 3).map((e) => `- \`${e}\``).join("\n"),
  )
  .join("\n\n") || "_(none)_"}

## Pages with network errors (top 5)

${RESULTS.pages
  .filter((p) => p.networkErrors.length)
  .slice(0, 5)
  .map(
    (p) =>
      `### ${p.slug} (${p.device})\n\n` +
      p.networkErrors.slice(0, 3).map((e) => `- \`${e}\``).join("\n"),
  )
  .join("\n\n") || "_(none)_"}
`;
  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit.md`), md, "utf-8");

  console.log("\nWrote:");
  console.log(`  ${AUDITS_DIR}/${TODAY}-polish-audit.json`);
  console.log(`  ${AUDITS_DIR}/${TODAY}-polish-audit.md`);
  console.log(`  ${OUT_DIR}/ (screenshots)`);
  console.log(
    `\nHeadlines: ${byImpact.critical || 0} critical · ${byImpact.serious || 0} serious · ${byImpact.moderate || 0} moderate · ${byImpact.minor || 0} minor · ${consoleErrTotal} console · ${netErrTotal} net · ${ttTotal} touch<44`,
  );
})();
