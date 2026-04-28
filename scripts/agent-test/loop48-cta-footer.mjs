// Loop 48 — verify Final CTA + Footer at 1440 + 375.
// Cloned from loop47-faq.mjs harness.

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

  // CTA section
  await page.locator("#rekisteroidy-cta").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop48-cta-${width}.png`), fullPage: false });

  await softCheck(`[${label}] cta title`, async () =>
    (await page.locator(".cta-card__title").textContent())?.trim()
  );
  await softCheck(`[${label}] cta button href`, async () =>
    await page.locator(".cta-card__btn").getAttribute("href")
  );
  await softCheck(`[${label}] cta button text`, async () =>
    (await page.locator(".cta-card__btn").textContent())?.trim().replace(/\s+/g, " ")
  );
  await softCheck(`[${label}] cta fineprint`, async () =>
    (await page.locator(".cta-card__fineprint").textContent())?.trim().replace(/\s+/g, " ")
  );

  // Footer
  await page.locator(".landing-footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop48-footer-${width}.png`), fullPage: false });
  await page.screenshot({ path: shot(`loop48-fullpage-${width}.png`), fullPage: true });

  await softCheck(`[${label}] footer brandmark`, async () =>
    (await page.locator(".landing-footer__brandmark").textContent())?.trim()
  );
  await softCheck(`[${label}] footer column titles`, async () =>
    (await page.locator(".landing-footer__col-title").allTextContents()).map((s) => s.trim())
  );
  await softCheck(`[${label}] footer column count`, async () =>
    await page.locator(".landing-footer__col").count()
  );
  await softCheck(`[${label}] footer link counts per column`, async () =>
    await page.locator(".landing-footer__col").evaluateAll((cols) =>
      cols.map((c) => c.querySelectorAll("a").length)
    )
  );
  await softCheck(`[${label}] footer copy`, async () =>
    (await page.locator(".landing-footer__copy").textContent())?.trim()
  );
  await softCheck(`[${label}] footer exam date`, async () =>
    (await page.locator(".landing-footer__exam time").getAttribute("datetime"))
  );
  await softCheck(`[${label}] register links → /app.html#rekisteroidy`, async () =>
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('a[href="/app.html#rekisteroidy"]'));
      return all.length;
    })
  );

  // axe across the whole page now
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
console.log("\nLoop 48 verification complete. See scripts/agent-test/screenshots/loop48-*.");
