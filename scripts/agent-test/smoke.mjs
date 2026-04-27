// Loop-0 smoke screenshot. Verifies Playwright + dev server work end-to-end
// and confirms no console errors / no btn-speak* element on landing or app shell.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { slug: "landing-desktop", url: "/", viewport: { width: 1440, height: 900 } },
  { slug: "landing-mobile",  url: "/", viewport: { width: 375,  height: 812 } },
  { slug: "app-desktop",     url: "/app.html", viewport: { width: 1440, height: 900 } },
  { slug: "app-mobile",      url: "/app.html", viewport: { width: 375,  height: 812 } },
];

const errors = [];
const browser = await chromium.launch();
try {
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: p.viewport });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[${p.slug}] console.error: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`[${p.slug}] pageerror: ${e.message}`));
    page.on("requestfailed", (r) => {
      const u = r.url();
      if (u.includes("/api/") || u.endsWith(".js") || u.endsWith(".css")) {
        errors.push(`[${p.slug}] requestfailed: ${u} — ${r.failure()?.errorText}`);
      }
    });
    await page.goto(BASE + p.url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(800);
    // Confirm no leftover speaker buttons
    const speakers = await page.$$eval("[id^=btn-speak], .btn-speaker", (els) => els.length);
    if (speakers > 0) errors.push(`[${p.slug}] still has ${speakers} speaker element(s) in DOM`);
    await page.screenshot({ path: path.join(OUT, `loop-0-${p.slug}.png`), fullPage: true });
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
} else {
  console.log("OK — 4 screenshots saved, 0 errors, 0 speaker elements left");
}
