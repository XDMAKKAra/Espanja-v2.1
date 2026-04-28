// L48-hotfix Update 1 verifier: dark theme toggle works,
// axe at 1440 + 375 in BOTH Vaalea (light) and Tumma (dark).
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const VPS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "375",  width: 375,  height: 812 },
];

const issues = [];
const browser = await chromium.launch();
try {
  for (const vp of VPS) {
    for (const theme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => issues.push(`[${vp.name}/${theme}] pageerror: ${e.message}`));

      // Pre-seed token + theme so app.html paints in the requested mode on first frame
      await page.addInitScript(({ t }) => {
        try {
          localStorage.setItem("puheo_token", "fake.jwt.token");
          localStorage.setItem("puheo_theme", t);
        } catch {}
      }, { t: theme });

      await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);

      const dataTheme = await page.locator("html").getAttribute("data-theme");
      if (dataTheme !== theme) issues.push(`[${vp.name}/${theme}] data-theme expected "${theme}", got "${dataTheme}"`);

      // Check the resolved background color is dark when theme=dark
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const ink = await page.evaluate(() => getComputedStyle(document.body).color);
      if (theme === "dark") {
        // body bg in dark mode should be near-black: rgb(10,10,10)
        if (!/^rgb\((\d+), (\d+), (\d+)/.test(bg)) issues.push(`[${vp.name}/${theme}] unexpected bg: ${bg}`);
        else {
          const [, r, g, b] = bg.match(/rgb\((\d+), (\d+), (\d+)/);
          const sum = +r + +g + +b;
          if (sum > 90) issues.push(`[${vp.name}/${theme}] body bg should be near-black, got ${bg} (sum=${sum})`);
        }
      } else {
        // light mode: body bg should be near-white (mint #F0FDF9 = 240+253+249)
        const [, r, g, b] = bg.match(/rgb\((\d+), (\d+), (\d+)/);
        const sum = +r + +g + +b;
        if (sum < 600) issues.push(`[${vp.name}/${theme}] body bg should be near-white, got ${bg} (sum=${sum})`);
      }

      await page.screenshot({ path: path.join(OUT, `l48hotfix-theme-${theme}-${vp.name}.png`), fullPage: false });

      const r = await new AxeBuilder({ page }).analyze();
      if (r.violations.length) {
        issues.push(`[${vp.name}/${theme}] axe: ${r.violations.length} violations: ${r.violations.map(v => v.id).join(", ")}`);
        for (const v of r.violations) {
          for (const n of v.nodes) {
            const summary = (n.failureSummary || "").split("\n")[1] || n.failureSummary;
            issues.push(`  - ${v.id} :: ${n.target.join(", ")} :: ${summary}`);
          }
        }
      }

      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

if (issues.length) {
  console.error("\n=== ISSUES ===\n" + issues.join("\n"));
  process.exit(1);
}
console.log("\n=== L48-hotfix theme verify: OK (light + dark, 1440 + 375) ===");
