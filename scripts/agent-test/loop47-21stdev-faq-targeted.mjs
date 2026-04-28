// Loop 47 — direct visit to FAQ-specific component pages on 21st.dev,
// since /s/faq listing pulled mixed (non-FAQ) cards in the first 6 anchors.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const OUT = path.resolve("references/landing/21stdev/faq");
fs.mkdirSync(OUT, { recursive: true });

const targets = [
  "/community/components/tailark/faq/default",
  "/community/components/tailark/faq/faq-accordion-with-title",
  "/community/components/tailark/faq/faq-accordion-with-text",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1800 },
  deviceScaleFactor: 1,
  locale: "en-US",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log(`pageerror: ${e.message}`));

try {
  for (let i = 0; i < targets.length; i++) {
    const href = targets[i];
    const url = `https://21st.dev${href}`;
    console.log(`Visiting ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2500);
      const safe = href.replace(/[^a-z0-9]/gi, "_").replace(/^_+|_+$/g, "");
      await page.screenshot({
        path: path.join(OUT, `direct-${String(i + 1).padStart(2, "0")}-${safe}.png`),
        fullPage: true,
      });

      // Try to extract the rendered preview HTML to inspect element semantics.
      const html = await page.evaluate(() => {
        // Grab the main preview region(s).
        const regions = Array.from(document.querySelectorAll("iframe, main, [class*='preview'], [class*='Preview']"));
        const found = regions.map((r) => {
          if (r.tagName === "IFRAME") {
            return { tag: "iframe", src: r.src || null };
          }
          return { tag: r.tagName, class: r.className.toString().slice(0, 120), html: r.innerHTML.slice(0, 1200) };
        });
        // Also dump any <details> elements found anywhere.
        const detailCount = document.querySelectorAll("details").length;
        return { detailCount, regions: found.slice(0, 4) };
      });
      fs.writeFileSync(
        path.join(OUT, `direct-${String(i + 1).padStart(2, "0")}-meta.json`),
        JSON.stringify(html, null, 2),
        "utf8"
      );
    } catch (e) {
      console.log(`  failed: ${e.message}`);
    }
  }
} finally {
  await ctx.close();
  await browser.close();
}

console.log("\nLoop 47 targeted FAQ browse complete.");
