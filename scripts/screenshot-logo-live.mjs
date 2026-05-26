// Quick visual verify: render index.html and app.html in headed Playwright,
// screenshot the nav + sidebar area to confirm the new <img> brand wordmark
// looks right.

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, "screenshots", "brand");
mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";

const browser = await chromium.launch();

// Desktop: index.html nav
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 200 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "live-index-nav-desktop.png"), clip: { x: 0, y: 0, width: 1280, height: 100 } });
  await ctx.close();
}

// Mobile: app.html topbar
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 200 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/app.html", { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "live-app-topbar-mobile.png"), clip: { x: 0, y: 0, width: 390, height: 100 } });
  await ctx.close();
}

// Desktop: app.html sidebar (logged-out shows auth, sidebar is hidden on mobile,
// but we can grab the auth-aside which also uses the logo)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/app.html", { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "live-app-fullpage-desktop.png"), fullPage: false });
  await ctx.close();
}

await browser.close();
console.log("Saved:");
console.log(`  ${OUT}/live-index-nav-desktop.png`);
console.log(`  ${OUT}/live-app-topbar-mobile.png`);
console.log(`  ${OUT}/live-app-fullpage-desktop.png`);
