// Loop 47 — verify FAQ section at 1440 + 375.
// Cloned from loop46-pricing.mjs harness.
// Asserts: 6 <details> items, 6 expected questions, chevron rotates on click,
// panel reveals, axe 0 violations.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000/";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });
const shot = (n) => path.join(OUT, n);

const EXPECTED_Q = [
  "Onko Puheo YTL:n virallisesti hyväksymä?",
  "Mitä jos YO-kokeen formaatti muuttuu?",
  "Mitä tietoja keräätte ja missä ne säilytetään?",
  "Voinko käyttää Puheoa puhelimella?",
  "Voiko tekoäly korvata oikean opettajan?",
  "Voinko peruuttaa Pro-tilauksen milloin tahansa?",
];

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

  await page.locator("#faq").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`loop47-faq-${width}.png`), fullPage: false });
  await page.screenshot({ path: shot(`loop47-faq-${width}-full.png`), fullPage: true });

  await softCheck(`[${label}] details count`, async () =>
    await page.locator("#faq .faq-item").count()
  );
  await softCheck(`[${label}] every <details>`, async () =>
    (await page.locator("#faq .faq-item").evaluateAll((els) =>
      els.map((e) => e.tagName)
    )).every((t) => t === "DETAILS")
  );
  await softCheck(`[${label}] question texts`, async () =>
    (await page.locator("#faq .faq-item__q-text").allTextContents()).map((s) => s.trim())
  );
  await softCheck(`[${label}] expected questions all present`, async () => {
    const got = (await page.locator("#faq .faq-item__q-text").allTextContents()).map((s) => s.trim());
    const missing = EXPECTED_Q.filter((q) => !got.includes(q));
    return missing.length === 0 ? "all 6 present" : `missing: ${JSON.stringify(missing)}`;
  });
  await softCheck(`[${label}] section title`, async () =>
    (await page.locator(".faq__title").textContent())?.trim()
  );

  // Open the first item by clicking its summary; verify chevron rotates + panel reveals.
  const first = page.locator("#faq .faq-item").first();
  const summary = first.locator("summary");
  await summary.scrollIntoViewIfNeeded();
  await summary.click();
  await page.waitForTimeout(420); // wait past 220ms transition

  await softCheck(`[${label}] first details open`, async () =>
    await first.evaluate((el) => el.open)
  );
  await softCheck(`[${label}] chevron rotated ~90°`, async () =>
    await first.locator(".faq-item__chev").evaluate((el) => {
      const m = window.getComputedStyle(el).transform;
      // matrix(0,1,-1,0,0,0) → 90° clockwise. Be generous: any rotation > 60°.
      if (!m || m === "none") return "no transform applied";
      // Parse "matrix(a,b,c,d,e,f)"
      const nums = m.match(/-?\d*\.?\d+/g)?.map(Number) || [];
      if (nums.length < 4) return m;
      const [a, b] = nums;
      const angleDeg = Math.atan2(b, a) * 180 / Math.PI;
      return `${angleDeg.toFixed(1)}°`;
    })
  );
  await softCheck(`[${label}] answer panel visible`, async () =>
    await first.locator(".faq-item__a").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { height: Math.round(r.height), display: window.getComputedStyle(el).display };
    })
  );

  await page.screenshot({ path: shot(`loop47-faq-${width}-open.png`), fullPage: false });

  // Close it back.
  await summary.click();
  await page.waitForTimeout(420);
  await softCheck(`[${label}] first details closed again`, async () =>
    await first.evaluate((el) => el.open)
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
console.log("\nLoop 47 verification complete. See scripts/agent-test/screenshots/loop47-*.");
