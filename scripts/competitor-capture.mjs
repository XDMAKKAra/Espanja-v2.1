// One-off: screenshot the design references Marcel keeps pointing to (WordDive, Studeo)
// so the redesign is grounded in their real DNA, not invented.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, "screenshots", "competitors-2026-06-01");
mkdirSync(OUT, { recursive: true });

const TARGETS = [
  { slug: "worddive", url: "https://www.worddive.com/" },
  { slug: "worddive-fi", url: "https://www.worddive.com/fi/" },
  { slug: "studeo", url: "https://www.studeo.fi/" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
for (const t of TARGETS) {
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(OUT, `${t.slug}-fold.png`), fullPage: false });
    await page.screenshot({ path: join(OUT, `${t.slug}-full.png`), fullPage: true });
    // Extract palette + fonts from computed styles
    const dna = await page.evaluate(() => {
      const colors = {}, fonts = {};
      const els = document.querySelectorAll("body *");
      let n = 0;
      for (const el of els) {
        if (n++ > 4000) break;
        const s = getComputedStyle(el);
        for (const c of [s.color, s.backgroundColor, s.borderColor]) {
          if (c && c !== "rgba(0, 0, 0, 0)" && c !== "rgb(0, 0, 0)") colors[c] = (colors[c] || 0) + 1;
        }
        if (s.fontFamily) fonts[s.fontFamily] = (fonts[s.fontFamily] || 0) + 1;
      }
      const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 12);
      return { colors: top(colors), fonts: top(fonts) };
    });
    console.log(`\n=== ${t.slug} (${t.url}) ===`);
    console.log("FONTS:", JSON.stringify(dna.fonts.map((f) => f[0]), null, 0));
    console.log("COLORS:", JSON.stringify(dna.colors.map((c) => `${c[0]} x${c[1]}`), null, 0));
  } catch (e) {
    console.log(`\n=== ${t.slug} FAILED: ${e.message.slice(0, 120)}`);
  }
}
await browser.close();
console.log("\ndone →", OUT);
