// Loop 32 — verify Magic UI grid-pattern backdrop on the auth screen.
// No login required — auth screen is the default active screen.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();

for (const vp of [{ slug: "auth-grid-desktop", w: 1440, h: 900 }, { slug: "auth-grid-mobile", w: 375, h: 812 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${vp.slug}] ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${vp.slug}] ${e.message}`));

  // No localStorage token — stay on screen-auth (the default).
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(900);

  // Sanity: confirm the SVG backdrop exists.
  const exists = await page.evaluate(() => !!document.querySelector("#screen-auth .auth-bg-grid pattern"));
  if (!exists) errors.push(`[${vp.slug}] auth-bg-grid pattern missing`);

  await page.screenshot({ path: path.join(OUT, `loop-32-${vp.slug}.png`), fullPage: false });
  await ctx.close();
}

await browser.close();
const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — auth grid screenshots saved");
