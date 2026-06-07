// One-off landing screenshot capture for the 2026-06-01 design audit.
// Captures the logged-out landing (/) full-page at desktop + mobile.
// Run: AUDIT_BASE_URL=http://localhost:3000 node scripts/landing-audit-capture.mjs
import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const OUT = join(REPO, "screenshots", "landing-audit-2026-06-01");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];

const browser = await chromium.launch();
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    userAgent: v.ua,
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, `landing-${v.name}.png`), fullPage: true });
  // Also an above-the-fold-only shot (no fullPage) to judge the hero in isolation
  await page.screenshot({ path: join(OUT, `landing-${v.name}-fold.png`), fullPage: false });
  console.log(`captured landing ${v.name}`);
  await ctx.close();
}
await browser.close();
console.log("done →", OUT);
