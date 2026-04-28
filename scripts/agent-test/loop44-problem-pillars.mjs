// Loop 44 — verify problem statement + 3 product pillars at 1440 + 375.
// Same harness shape as loop43-nav-hero.mjs.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000/";
const OUT_DIR = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });
const shot = (n) => path.join(OUT_DIR, n);

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
    if (t === "error") console.log(`[${label}] console.${t}: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(700);

  // Scroll the problem section into view, screenshot.
  await page.locator("#ongelma").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop44-problem-${width}.png`), fullPage: false });

  // Then pillars.
  await page.locator("#tuote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop44-pillars-${width}.png`), fullPage: false });

  // Full page shot.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`loop44-fullpage-${width}.png`), fullPage: true });

  // Soft assertions.
  await softCheck(`[${label}] problem lede`, async () =>
    (await page.locator(".problem__lede").textContent())?.replace(/\s+/g, " ").trim().slice(0, 80)
  );
  await softCheck(`[${label}] problem sub`, async () =>
    (await page.locator(".problem__sub").textContent())?.replace(/\s+/g, " ").trim().slice(0, 80)
  );
  await softCheck(`[${label}] pillars title`, async () =>
    (await page.locator(".pillars__title").textContent())?.trim()
  );
  await softCheck(`[${label}] pillar count`, async () =>
    await page.locator(".pillar").count()
  );
  await softCheck(`[${label}] pillar titles`, async () =>
    await page.locator(".pillar__title").allTextContents()
  );
  await softCheck(`[${label}] pillar thumb count`, async () =>
    await page.locator(".pillar__thumb img").count()
  );
  await softCheck(`[${label}] pillar thumbs natural sizes`, async () =>
    await page.evaluate(() =>
      Array.from(document.querySelectorAll(".pillar__thumb img")).map((img) => ({
        src: img.getAttribute("src").split("/").pop(),
        w: img.naturalWidth, h: img.naturalHeight,
      }))
    )
  );

  // axe across the entire page.
  try {
    await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js" });
    const result = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { resultTypes: ["violations"] });
      return r.violations.map((v) => ({
        id: v.id, impact: v.impact, count: v.nodes.length,
        targets: v.nodes.slice(0, 3).map((n) => ({
          target: n.target?.join(" "),
          summary: (n.failureSummary || "").slice(0, 240),
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
console.log("\nLoop 44 verification complete. See scripts/agent-test/screenshots/loop44-*.");
