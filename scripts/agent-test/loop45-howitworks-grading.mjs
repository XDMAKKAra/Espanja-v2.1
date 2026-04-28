// Loop 45 — verify How It Works + AI-grading showcase at 1440 + 375.
// Same harness shape as L43/L44.

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

  await page.locator("#miten").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop45-steps-${width}.png`), fullPage: false });

  await page.locator("#arviointi").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop45-grader-${width}.png`), fullPage: false });

  // Hover the first error span to verify the tooltip pops.
  if (width === 1440) {
    const firstErr = page.locator(".grader-prose .ge").first();
    await firstErr.hover();
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot("loop45-grader-tooltip-1440.png"), fullPage: false });
  }

  // Soft assertions.
  await softCheck(`[${label}] step count`, async () =>
    await page.locator(".step").count()
  );
  await softCheck(`[${label}] step nums`, async () =>
    await page.locator(".step__num").allTextContents()
  );
  await softCheck(`[${label}] grader prose first 80 chars`, async () =>
    (await page.locator(".grader-prose").textContent())?.replace(/\s+/g, " ").trim().slice(0, 80)
  );
  await softCheck(`[${label}] grader error annotation count`, async () =>
    await page.locator(".grader-prose .ge").count()
  );
  await softCheck(`[${label}] rubric row count`, async () =>
    await page.locator(".rubric-row").count()
  );
  await softCheck(`[${label}] grader total score visible`, async () =>
    (await page.locator(".rubric-total__score").textContent())?.trim()
  );
  await softCheck(`[${label}] grader copy title`, async () =>
    (await page.locator(".grader-copy__title").textContent())?.trim()
  );

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
console.log("\nLoop 45 verification complete. See scripts/agent-test/screenshots/loop45-*.");
