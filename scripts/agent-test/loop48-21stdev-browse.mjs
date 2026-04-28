// Loop 48 — browse 21st.dev/s/cta + 21st.dev/s/footer, capture candidates.
// Cloned from loop47-21stdev-browse.mjs; visits both section listings + 6 cards each.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const SECTIONS = [
  { slug: "cta",    out: path.resolve("references/landing/21stdev/cta") },
  { slug: "footer", out: path.resolve("references/landing/21stdev/footer") },
];

for (const s of SECTIONS) fs.mkdirSync(s.out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1800 },
  deviceScaleFactor: 1,
  locale: "en-US",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log(`pageerror: ${e.message}`));

try {
  for (const sec of SECTIONS) {
    console.log(`\n=== /s/${sec.slug} ===`);
    await page.goto(`https://21st.dev/s/${sec.slug}`, { waitUntil: "domcontentloaded", timeout: 30000 });
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

    await page.screenshot({ path: path.join(sec.out, "listing-1440.png"), fullPage: true });
    console.log(`Saved listing for /s/${sec.slug}.`);

    const links = await page.evaluate((slug) => {
      const out = [];
      const anchors = Array.from(document.querySelectorAll('a[href*="/r/"], a[href^="/"]'));
      for (const a of anchors) {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("/s/")) continue;
        if (href.startsWith("/login") || href.startsWith("/signup")) continue;
        if (href === "/" || href === "/about") continue;
        const parts = href.replace(/^\//, "").split("/");
        if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
          // Prefer paths that mention the slug.
          const text = (a.textContent || "").trim().slice(0, 80);
          out.push({ href, text, mentions: href.includes(slug) });
        }
      }
      // Sort: mentions-first, then preserve order.
      out.sort((a, b) => Number(b.mentions) - Number(a.mentions));
      const seen = new Set();
      const unique = [];
      for (const x of out) {
        if (seen.has(x.href)) continue;
        seen.add(x.href);
        unique.push(x);
        if (unique.length >= 12) break;
      }
      return unique;
    }, sec.slug);

    console.log(`Found ${links.length} candidate links for /s/${sec.slug}:`);
    for (const l of links) console.log(`  ${l.href}  ${l.mentions ? "[match]" : ""}  ${l.text ? "— " + l.text : ""}`);

    fs.writeFileSync(
      path.join(sec.out, "candidates.json"),
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
          path: path.join(sec.out, `candidate-${String(i + 1).padStart(2, "0")}-${safe}.png`),
          fullPage: true,
        });
      } catch (e) {
        console.log(`  failed: ${e.message}`);
      }
    }
  }
} finally {
  await ctx.close();
  await browser.close();
}

console.log("\nLoop 48 21st.dev browse complete.");
