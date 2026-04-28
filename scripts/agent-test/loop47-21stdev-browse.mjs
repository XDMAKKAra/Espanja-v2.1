// Loop 47 — browse 21st.dev/s/faq, capture candidate component thumbnails.
// Cloned from loop46-21stdev-browse.mjs; only the listing URL + OUT path differ.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const OUT = path.resolve("references/landing/21stdev/faq");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1800 },
  deviceScaleFactor: 1,
  locale: "en-US",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log(`pageerror: ${e.message}`));

try {
  console.log("Visiting 21st.dev/s/faq …");
  await page.goto("https://21st.dev/s/faq", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2500);

  for (const sel of [
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    'button:has-text("Got it")',
    'button:has-text("OK")',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    } catch {}
  }

  await page.screenshot({ path: path.join(OUT, "listing-1440.png"), fullPage: true });
  console.log("Saved listing screenshot.");

  const links = await page.evaluate(() => {
    const out = [];
    const anchors = Array.from(document.querySelectorAll('a[href*="/r/"], a[href^="/"]'));
    for (const a of anchors) {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("/s/")) continue;
      if (href.startsWith("/login") || href.startsWith("/signup")) continue;
      if (href === "/" || href === "/about") continue;
      const parts = href.replace(/^\//, "").split("/");
      if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
        const text = (a.textContent || "").trim().slice(0, 80);
        out.push({ href, text });
      }
    }
    const seen = new Set();
    const unique = [];
    for (const x of out) {
      if (seen.has(x.href)) continue;
      seen.add(x.href);
      unique.push(x);
      if (unique.length >= 12) break;
    }
    return unique;
  });

  console.log(`Found ${links.length} candidate component links:`);
  for (const l of links) console.log(`  ${l.href}  ${l.text ? "— " + l.text : ""}`);

  fs.writeFileSync(
    path.join(OUT, "candidates.json"),
    JSON.stringify(links, null, 2),
    "utf8"
  );

  for (let i = 0; i < Math.min(6, links.length); i++) {
    const l = links[i];
    const url = l.href.startsWith("http") ? l.href : `https://21st.dev${l.href}`;
    try {
      console.log(`Visiting ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const safe = l.href.replace(/[^a-z0-9]/gi, "_").replace(/^_+|_+$/g, "");
      await page.screenshot({
        path: path.join(OUT, `candidate-${String(i + 1).padStart(2, "0")}-${safe}.png`),
        fullPage: true,
      });
    } catch (e) {
      console.log(`  failed: ${e.message}`);
    }
  }
} finally {
  await ctx.close();
  await browser.close();
}

console.log("\nLoop 47 21st.dev browse complete. See references/landing/21stdev/faq/");
