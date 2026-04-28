// L48-hotfix verifier: auth screen layout, landing logo + chip swap,
// right rail (no big upsell, popup behaves), axe at 1440 + 375.
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
const log = (m) => { console.log(m); };

const browser = await chromium.launch();
try {
  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => issues.push(`[${vp.name}] pageerror: ${e.message}`));

    // ─── Landing — logged-out: should show Kirjaudu + Aloita, NO chip ───
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const navBrand = await page.locator(".nav__brand").textContent();
    if (!/Puheo/.test(navBrand || "")) issues.push(`[${vp.name}] landing brand text wrong: "${navBrand}"`);
    const oCount = await page.locator(".nav__brand-o").count();
    if (oCount !== 1) issues.push(`[${vp.name}] expected .nav__brand-o once, found ${oCount}`);
    const dotCount = await page.locator(".nav__brand-dot").count();
    if (dotCount !== 0) issues.push(`[${vp.name}] old .nav__brand-dot still in DOM`);

    const loginVis = await page.locator("#nav-login").isVisible().catch(() => false);
    const chipHidden = await page.locator("#nav-chip").evaluate((el) => el.hidden).catch(() => true);
    if (vp.name === "1440") {
      if (!loginVis) issues.push(`[${vp.name}] #nav-login should be visible logged-out`);
      if (!chipHidden) issues.push(`[${vp.name}] #nav-chip should be hidden logged-out`);
    }
    await page.screenshot({ path: path.join(OUT, `l48hotfix-landing-loggedout-${vp.name}.png`), fullPage: false });

    // axe — landing logged-out
    const r1 = await new AxeBuilder({ page }).analyze();
    if (r1.violations.length) issues.push(`[${vp.name}] landing logged-out axe: ${r1.violations.length} violations: ${r1.violations.map(v => v.id).join(", ")}`);

    // ─── Landing — logged-in: chip should appear, kirjaudu hidden ───
    await page.evaluate(() => localStorage.setItem("puheo_token", "fake.jwt.token"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const loginHiddenIn = await page.locator("#nav-login").evaluate((el) => el.hidden).catch(() => true);
    const chipVisIn = await page.locator("#nav-chip").isVisible().catch(() => false);
    if (vp.name === "1440") {
      if (!loginHiddenIn) issues.push(`[${vp.name}] #nav-login should be hidden logged-in`);
      if (!chipVisIn) issues.push(`[${vp.name}] #nav-chip should be visible logged-in`);
      const chipHref = await page.locator("#nav-chip").getAttribute("href");
      if (chipHref !== "/app.html") issues.push(`[${vp.name}] chip href: "${chipHref}"`);
    }
    await page.screenshot({ path: path.join(OUT, `l48hotfix-landing-loggedin-${vp.name}.png`), fullPage: false });

    const r2 = await new AxeBuilder({ page }).analyze();
    if (r2.violations.length) issues.push(`[${vp.name}] landing logged-in axe: ${r2.violations.length} violations: ${r2.violations.map(v => v.id).join(", ")}`);

    // ─── App auth screen (logged out) ───
    await page.evaluate(() => localStorage.removeItem("puheo_token"));
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    // Make sure we're actually on screen-auth
    const authVisible = await page.locator("#screen-auth").isVisible().catch(() => false);
    if (!authVisible) issues.push(`[${vp.name}] #screen-auth not visible`);
    // Check shell width vs viewport: title shouldn't clip
    const titleBox = await page.locator("#auth-title").boundingBox().catch(() => null);
    if (titleBox && titleBox.x < 0) issues.push(`[${vp.name}] auth title clips left: x=${titleBox.x}`);
    if (titleBox && titleBox.x + titleBox.width > vp.width + 4) issues.push(`[${vp.name}] auth title overflows right: ${titleBox.x + titleBox.width} > ${vp.width}`);
    // The aside shows on >=960px only — verify it's not clipping at 1440
    if (vp.name === "1440") {
      const asideBox = await page.locator(".auth-aside").boundingBox().catch(() => null);
      if (!asideBox) issues.push(`[${vp.name}] .auth-aside not present at 1440`);
      else if (asideBox.x + asideBox.width > vp.width + 4) issues.push(`[${vp.name}] .auth-aside overflows right`);
    }
    await page.screenshot({ path: path.join(OUT, `l48hotfix-auth-${vp.name}.png`), fullPage: false });

    const r3 = await new AxeBuilder({ page }).analyze();
    if (r3.violations.length) {
      issues.push(`[${vp.name}] auth axe: ${r3.violations.length} violations: ${r3.violations.map(v => v.id).join(", ")}`);
      for (const v of r3.violations) {
        for (const n of v.nodes) {
          issues.push(`  - ${v.id} :: ${n.target.join(", ")} :: ${n.failureSummary?.split('\n')[1] || n.failureSummary}`);
        }
      }
    }

    // ─── App dashboard (faked logged-in) — verify upsell card removed ───
    // Stub auth + dashboard so the rail renders. Token alone is enough to
    // pass isLoggedIn(); the dashboard fetch will 401, but the rail JS still
    // wires the panels.
    await page.evaluate(() => localStorage.setItem("puheo_token", "fake.jwt.token"));
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const upsellPresent = await page.locator("#rail-panel-pro, .rail-panel--upsell").count();
    if (upsellPresent !== 0) issues.push(`[${vp.name}] rail still has Pro upsell card (#rail-panel-pro)`);
    const popupPresent = await page.locator("#pro-popup").count();
    if (popupPresent !== 1) issues.push(`[${vp.name}] #pro-popup not in DOM`);

    await page.screenshot({ path: path.join(OUT, `l48hotfix-app-dashboard-${vp.name}.png`), fullPage: false });

    await ctx.close();
  }
} finally {
  await browser.close();
}

if (issues.length) {
  console.error("\n=== ISSUES ===\n" + issues.join("\n"));
  process.exit(1);
}
console.log("\n=== L48-hotfix verify: OK ===");
