// L-V323 performance baseline audit — collects Core Web Vitals
// (LCP, CLS, FCP, TTFB) for every public + logged-in surface, ranks
// them, and writes a markdown report.
//
// Run: AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-perf.mjs

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

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

const BASE = process.env.AUDIT_BASE_URL || "https://espanja-v2-1.vercel.app";
const TODAY = "2026-05-26";
const AUDITS_DIR = join(REPO, "docs", "audits");
mkdirSync(AUDITS_DIR, { recursive: true });

// Web Vitals thresholds (Google)
const T = {
  LCP: { good: 2500, ni: 4000 },
  CLS: { good: 0.1, ni: 0.25 },
  FCP: { good: 1800, ni: 3000 },
  TTFB: { good: 800, ni: 1800 },
};

const PUBLIC_PAGES = [
  { slug: "p01-index", url: "/" },
  { slug: "p02-landing-es", url: "/espanja-yo-koe" },
  { slug: "p03-landing-de", url: "/saksan-yo-koe" },
  { slug: "p04-landing-fr", url: "/ranskan-yo-koe" },
  { slug: "p05-diagnose", url: "/diagnose.html" },
  { slug: "p06-pricing", url: "/pricing.html" },
  { slug: "p07-terms", url: "/terms.html" },
  { slug: "p08-privacy", url: "/privacy.html" },
  { slug: "p09-refund", url: "/refund.html" },
  { slug: "p10-blog", url: "/blog/" },
  { slug: "p11-app-unauth", url: "/app.html" },
];

const LOGGED_IN_HASHES = [
  { slug: "l01-home", hash: "#/koti" },
  { slug: "l02-profile", hash: "#/profiili" },
  { slug: "l03-settings", hash: "#/asetukset" },
  { slug: "l04-vocab", hash: "#/sanasto" },
  { slug: "l05-grammar", hash: "#/kielioppi" },
  { slug: "l06-reading", hash: "#/lukeminen" },
  { slug: "l07-writing", hash: "#/kirjoittaminen" },
  { slug: "l08-results", hash: "#/tulokset" },
  { slug: "l09-exam", hash: "#/koe" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];

const RESULTS = { run: TODAY, base: BASE, pages: [] };

async function measure(page, url, viewport, slug) {
  let status = "ok";
  let m = { ttfb: null, fcp: null, lcp: null, cls: null, dcl: null, load: null, bytes: null };
  try {
    // Track total transferred bytes
    let totalBytes = 0;
    const onResp = (res) => {
      try {
        const cl = res.headers()["content-length"];
        if (cl) totalBytes += parseInt(cl, 10);
      } catch {}
    };
    page.on("response", onResp);

    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    if (!resp || resp.status() >= 400) {
      status = `goto-${resp ? resp.status() : "no-response"}`;
      page.off("response", onResp);
      return { slug, viewport: viewport.name, url, status, ...m };
    }

    // Use buffered PerformanceObserver — LCP entries arrive asynchronously,
    // and getEntriesByType("largest-contentful-paint") needs the observer
    // registered or buffered:true. Plus wait 3s for LCP to settle.
    m = await page.evaluate(() => new Promise((resolve) => {
      let lcp = 0;
      let clsTotal = 0;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) lcp = Math.max(lcp, e.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) clsTotal += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}

      setTimeout(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const paints = performance.getEntriesByType("paint");
        const fcp = paints.find((p) => p.name === "first-contentful-paint");
        resolve({
          ttfb: nav ? Math.round(nav.responseStart) : null,
          fcp: fcp ? Math.round(fcp.startTime) : null,
          lcp: lcp ? Math.round(lcp) : null,
          cls: Math.round(clsTotal * 1000) / 1000,
          dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          load: nav ? Math.round(nav.loadEventEnd) : null,
        });
      }, 3000);
    }));

    m.bytes = totalBytes;
    page.off("response", onResp);
  } catch (err) {
    status = `error: ${err.message.slice(0, 160)}`;
  }
  return { slug, viewport: viewport.name, url, status, ...m };
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
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) { try { await loginTab.click({ timeout: 3000 }); } catch {} }
  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PW);
  const submitBtn = page.locator("#btn-auth-submit");
  await submitBtn.scrollIntoViewIfNeeded();
  const [loginRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/") && r.request().method() === "POST", { timeout: 15000 }),
    submitBtn.click({ force: true }),
  ]);
  if (loginRes.status() >= 400) throw new Error(`Login failed: ${loginRes.status()}`);
  await page.waitForTimeout(1500);
  return { ctx, page };
}

function classify(metric, value) {
  if (value == null) return "—";
  const t = T[metric];
  if (!t) return "—";
  if (value <= t.good) return "good";
  if (value <= t.ni) return "ni";
  return "poor";
}

(async () => {
  console.log(`Perf audit · base=${BASE} · ${PUBLIC_PAGES.length} public + ${LOGGED_IN_HASHES.length} logged-in × ${VIEWPORTS.length} viewports`);
  const browser = await chromium.launch();

  // Public surfaces (fresh context per page so caching is consistent)
  for (const v of VIEWPORTS) {
    console.log(`\n--- viewport: ${v.name} ---`);
    for (const p of PUBLIC_PAGES) {
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        userAgent: v.ua,
        deviceScaleFactor: 2,
      });
      await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
      const page = await ctx.newPage();
      const r = await measure(page, BASE + p.url, v, p.slug);
      console.log(`  ${r.slug} · ${r.status} · LCP=${r.lcp}ms CLS=${r.cls} FCP=${r.fcp}ms TTFB=${r.ttfb}ms`);
      RESULTS.pages.push(r);
      await ctx.close();
    }
  }

  // Logged-in surfaces (reuse logged-in context per viewport)
  if (EMAIL && PW) {
    for (const v of VIEWPORTS) {
      console.log(`\n--- logged-in viewport: ${v.name} ---`);
      let ctx, page;
      try {
        const r = await loginCtx(browser, v);
        ctx = r.ctx;
        page = r.page;
      } catch (err) {
        console.error(`  login failed: ${err.message}`);
        continue;
      }
      // SPA hash routes don't trigger page-load — reload fully for each
      // so PerformanceObserver gets fresh nav timing per surface
      await ctx.close();
      for (const p of LOGGED_IN_HASHES) {
        // Open fresh context, log in, navigate to hash, measure
        let lctx;
        try {
          const r = await loginCtx(browser, v);
          lctx = r.ctx;
          const lpage = r.page;
          // Force fresh navigation: hash-only URL changes don't trigger a
          // Playwright goto (returns null → "goto-no-response"). Adding a
          // cache-busting query param makes the URL differ in more than
          // just the fragment, so the browser does a real document load
          // and PerformanceObserver captures fresh nav timing.
          const res = await measure(lpage, `${BASE}/app.html?t=${Date.now()}${p.hash}`, v, p.slug);
          console.log(`  ${res.slug} · ${res.status} · LCP=${res.lcp}ms CLS=${res.cls} FCP=${res.fcp}ms`);
          RESULTS.pages.push(res);
        } catch (err) {
          console.error(`  ${p.slug}: ${err.message.slice(0, 80)}`);
          RESULTS.pages.push({ slug: p.slug, viewport: v.name, url: p.hash, status: `error: ${err.message.slice(0, 100)}`, ttfb: null, fcp: null, lcp: null, cls: null, dcl: null, load: null, bytes: null });
        }
        if (lctx) await lctx.close();
      }
    }
  } else {
    console.log("\n(Skipping logged-in surfaces — TEST_LOGIN_EMAIL not set)");
  }

  await browser.close();

  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit-perf.json`), JSON.stringify(RESULTS, null, 2), "utf-8");

  // Categorize
  const buckets = { good: [], ni: [], poor: [] };
  for (const r of RESULTS.pages) {
    if (r.lcp == null) continue;
    buckets[classify("LCP", r.lcp)].push(r);
  }

  // Sort by worst LCP for the report
  const sorted = [...RESULTS.pages].filter(r => r.lcp != null).sort((a, b) => (b.lcp || 0) - (a.lcp || 0));

  const md = `# L-V323 performance baseline · ${TODAY}

**Base:** ${BASE}
**Pages:** ${PUBLIC_PAGES.length} public + ${LOGGED_IN_HASHES.length} logged-in × ${VIEWPORTS.length} viewports = ${(PUBLIC_PAGES.length + LOGGED_IN_HASHES.length) * VIEWPORTS.length} scans
**Account:** ${EMAIL || "(public only)"}
**Full data:** \`docs/audits/${TODAY}-polish-audit-perf.json\`

## Web Vitals thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB | ≤ 0.8s | ≤ 1.8s | > 1.8s |

## Headline

- **${buckets.good.length} pages good · ${buckets.ni.length} needs improvement · ${buckets.poor.length} poor (by LCP)**

## All pages ranked by LCP (worst first)

| Slug | Viewport | LCP (ms) | CLS | FCP (ms) | TTFB (ms) | Bytes | Status |
|---|---|---|---|---|---|---|---|
${sorted.map(r => {
  const lcpTag = classify("LCP", r.lcp);
  const clsTag = classify("CLS", r.cls);
  const fcpTag = classify("FCP", r.fcp);
  const ttfbTag = classify("TTFB", r.ttfb);
  const lcpMark = lcpTag === "good" ? "" : lcpTag === "ni" ? " ⚠️" : " 🔴";
  return `| ${r.slug} | ${r.viewport} | ${r.lcp ?? "—"}${lcpMark} | ${r.cls ?? "—"} | ${r.fcp ?? "—"} | ${r.ttfb ?? "—"} | ${r.bytes ? Math.round(r.bytes / 1024) + " KB" : "—"} | ${r.status} |`;
}).join("\n")}

## Poor LCP pages (>4s)

${buckets.poor.length === 0 ? "_(none — all pages ≤4s LCP)_" :
  buckets.poor.map(r => `- **${r.slug} ${r.viewport}** — LCP ${r.lcp}ms (target ≤2500ms)`).join("\n")}

## Needs-improvement LCP pages (2.5–4s)

${buckets.ni.length === 0 ? "_(none — all pages ≤2.5s LCP)_" :
  buckets.ni.map(r => `- **${r.slug} ${r.viewport}** — LCP ${r.lcp}ms`).join("\n")}

## CLS issues (>0.1)

${RESULTS.pages.filter(r => r.cls != null && r.cls > 0.1).length === 0 ? "_(none)_" :
  RESULTS.pages.filter(r => r.cls != null && r.cls > 0.1).map(r => `- **${r.slug} ${r.viewport}** — CLS ${r.cls}`).join("\n")}

## TTFB issues (>800ms)

${RESULTS.pages.filter(r => r.ttfb != null && r.ttfb > 800).length === 0 ? "_(none)_" :
  RESULTS.pages.filter(r => r.ttfb != null && r.ttfb > 800).slice(0, 10).map(r => `- **${r.slug} ${r.viewport}** — TTFB ${r.ttfb}ms`).join("\n")}
`;
  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit-perf.md`), md, "utf-8");

  console.log(`\nHeadlines: ${buckets.good.length} good · ${buckets.ni.length} ni · ${buckets.poor.length} poor (LCP)`);
  console.log(`\nWrote: ${AUDITS_DIR}/${TODAY}-polish-audit-perf.{json,md}`);
})();
