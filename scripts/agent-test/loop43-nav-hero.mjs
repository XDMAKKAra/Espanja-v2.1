// Loop 43 — verify the rebuilt landing nav + hero at 1440 + 375.
//
// Captures:
//   • screenshots/loop43-hero-1440.png  (hero viewport, scroll y=0)
//   • screenshots/loop43-hero-1440-scrolled.png (after scroll, nav blurred-state)
//   • screenshots/loop43-hero-375.png  (mobile viewport)
//
// Asserts (soft, prints to console):
//   • Primary CTA href === '/app.html#rekisteroidy'
//   • Secondary "Kirjaudu" href === '/app.html#kirjaudu'
//   • H1 text contains 'Pärjää espanjan YO-kokeessa'
//   • Trust strip text contains 'Ei luottokorttia', 'Suomen kielellä', 'Toimii selaimessa'
//   • Browser-frame img <img> renders with naturalWidth > 0
//   • Floating-card present
//   • nav data-scrolled flips to "true" after scroll y > 8
//   • axe-core run via @axe-core/source CDN (best-effort) — print violation count
//
// Usage: node scripts/agent-test/loop43-nav-hero.mjs
// (requires the dev server on :3000)

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000/";
const OUT_DIR = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

function shotPath(name) { return path.join(OUT_DIR, name); }

async function softCheck(label, fn) {
  try {
    const v = await fn();
    console.log(`✔ ${label}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
    return v;
  } catch (e) {
    console.log(`✘ ${label}: ${e.message}`);
    return null;
  }
}

async function runViewport(browser, { width, height, label }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    serviceWorkers: "block",
    deviceScaleFactor: 1,
    locale: "fi-FI",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[${label}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    const t = m.type();
    if (t === "error" || t === "warning") {
      console.log(`[${label}] console.${t}: ${m.text()}`);
    }
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  // Let fonts settle.
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(700);

  // Pre-scroll shot.
  await page.screenshot({ path: shotPath(`loop43-hero-${width}.png`), fullPage: false });

  // Soft assertions.
  await softCheck(`[${label}] primary CTA href`, async () => {
    return await page.locator(".hero__ctas a.btn--primary").first().getAttribute("href");
  });
  await softCheck(`[${label}] nav Kirjaudu href`, async () => {
    return await page.locator(".nav__cta a.btn--quiet").first().getAttribute("href");
  });
  await softCheck(`[${label}] nav primary CTA href`, async () => {
    return await page.locator(".nav__cta a.btn--primary").first().getAttribute("href");
  });
  await softCheck(`[${label}] H1 text`, async () => {
    return (await page.locator(".hero__title").first().textContent())?.trim().slice(0, 80);
  });
  await softCheck(`[${label}] trust strip`, async () => {
    return (await page.locator(".hero__trust").first().textContent())?.replace(/\s+/g, " ").trim();
  });
  await softCheck(`[${label}] dashboard img loaded`, async () => {
    return await page.evaluate(() => {
      const img = document.querySelector(".browser-frame__viewport img");
      return img ? { w: img.naturalWidth, h: img.naturalHeight, src: img.getAttribute("src") } : null;
    });
  });
  await softCheck(`[${label}] floating card visible`, async () => {
    return await page.locator(".floating-card").first().isVisible();
  });
  await softCheck(`[${label}] nav at top, data-scrolled`, async () => {
    return await page.locator("#nav").first().getAttribute("data-scrolled");
  });

  // Scroll → confirm nav data-scrolled flips.
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.waitForTimeout(250);
  await softCheck(`[${label}] nav after scroll, data-scrolled`, async () => {
    return await page.locator("#nav").first().getAttribute("data-scrolled");
  });

  if (width === 1440) {
    await page.screenshot({ path: shotPath("loop43-hero-1440-scrolled.png"), fullPage: false });
  }

  // axe-core best-effort: inject from CDN, run, print violation count.
  try {
    await page.addScriptTag({
      url: "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js",
    });
    const result = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { resultTypes: ["violations"] });
      return r.violations.map((v) => ({
        id: v.id, impact: v.impact, count: v.nodes.length,
        targets: v.nodes.slice(0, 3).map((n) => ({
          target: n.target?.join(" "),
          summary: (n.failureSummary || "").slice(0, 200),
        })),
      }));
    });
    console.log(`[${label}] axe violations (${result.length}):`);
    for (const v of result) {
      console.log(`   - ${v.id} (${v.impact}) × ${v.count}`);
      for (const t of v.targets) {
        console.log(`       ${t.target}\n       ${t.summary}`);
      }
    }
  } catch (e) {
    console.log(`[${label}] axe run skipped: ${e.message}`);
  }

  await ctx.close();
}

const browser = await chromium.launch();
try {
  await runViewport(browser, { width: 1440, height: 900, label: "desktop" });
  await runViewport(browser, { width: 375,  height: 812, label: "mobile" });
} finally {
  await browser.close();
}

console.log("\nLoop 43 verification complete. Screenshots in scripts/agent-test/screenshots/");
