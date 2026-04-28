// Loop 46 — verify Pricing section at 1440 + 375.
// Same harness shape as L43/L44/L45.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000/";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });
const shot = (n) => path.join(OUT, n);

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
    if (m.type() === "error") console.log(`[${label}] console.error: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(700);

  await page.locator("#hinnoittelu").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop46-pricing-${width}.png`), fullPage: false });
  await page.screenshot({ path: shot(`loop46-pricing-${width}-full.png`), fullPage: true });

  await softCheck(`[${label}] pricing card count`, async () =>
    await page.locator(".pricing-card").count()
  );
  await softCheck(`[${label}] pricing card names`, async () =>
    await page.locator(".pricing-card__name").allTextContents()
  );
  await softCheck(`[${label}] pricing card prices`, async () =>
    (await page.locator(".pricing-card__price-num").allTextContents()).map((s) => s.replace(/ /g, " ").trim())
  );
  await softCheck(`[${label}] free CTA href`, async () =>
    await page.locator(".pricing-card:not(.pricing-card--pro) .pricing-card__cta").getAttribute("href")
  );
  await softCheck(`[${label}] pro CTA href`, async () =>
    await page.locator(".pricing-card--pro .pricing-card__cta").getAttribute("href")
  );
  await softCheck(`[${label}] pro chip text`, async () =>
    (await page.locator(".pricing-card__chip").textContent())?.trim()
  );
  await softCheck(`[${label}] free feature counts (yes/no)`, async () => ({
    yes: await page.locator(".pricing-card:not(.pricing-card--pro) .pricing-card__feature--yes").count(),
    no:  await page.locator(".pricing-card:not(.pricing-card--pro) .pricing-card__feature--no").count(),
  }));
  await softCheck(`[${label}] pro feature counts (yes/no)`, async () => ({
    yes: await page.locator(".pricing-card--pro .pricing-card__feature--yes").count(),
    no:  await page.locator(".pricing-card--pro .pricing-card__feature--no").count(),
  }));
  await softCheck(`[${label}] section title`, async () =>
    (await page.locator(".pricing__title").textContent())?.trim()
  );

  // axe
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
console.log("\nLoop 46 verification complete. See scripts/agent-test/screenshots/loop46-*.");
