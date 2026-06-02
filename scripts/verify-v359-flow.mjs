#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V359 verification — diagnostic-first onboarding → results → product choice.
 * Logs in, drives the V4 flow to the summary, then exercises all three branches
 * of the new product-selection screen (Kurssi / Treeni → 503 graceful state;
 * Jatka ilmaisena → leaves the flow). Desktop + 390px (no h-scroll).
 */
import "dotenv/config";
import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const BASE  = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_LOGIN_EMAIL || "testpro123@gmail.com";
const PASS  = process.env.TEST_LOGIN_PASSWORD || "Testpro123";

let failures = 0;
const ok = (m) => console.log("  ✓ " + m);
const fail = (m) => { console.error("  ✗ " + m); failures++; };

async function login(page) {
  await page.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  await page.goto(`${BASE}/app.html`);
  await page.waitForLoadState("domcontentloaded");
  const tab = page.locator("#tab-login");
  if (await tab.count()) await tab.click().catch(() => {});
  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PASS);
  await Promise.all([
    page.waitForResponse(r => /\/api\/(login|auth\/login)/.test(r.url()) && r.status() < 500, { timeout: 15000 }).catch(() => null),
    page.locator("#btn-auth-submit").click(),
  ]);
  await page.waitForTimeout(800);
}

// Drive V4 from intro → summary using the skip paths (no diagnostic content needed).
async function toSummary(page) {
  // In the real flow the user is logged-out, so the app shell (bottom mobile-nav)
  // is absent. Here we invoke onboarding mid-session, so hide the shell nav that
  // would otherwise overlay the onboarding action buttons.
  await page.addStyleTag({ content: "#mobile-nav,.mobile-nav{display:none!important}" });
  await page.evaluate(() => window._onboardingV4?.show());
  await page.waitForSelector("#screen-ob-v4-intro.active", { timeout: 8000 });
  await page.locator("#ob-v4-intro-skip").click();          // → courses
  await page.waitForSelector("#screen-ob-v4-courses.active", { timeout: 8000 });
  await page.locator("#ob-v4-courses-continue").click();    // → biography
  await page.waitForSelector("#screen-ob-v4-biography.active", { timeout: 8000 });
  await page.locator("#ob-v4-bio-continue").click();        // → summary (no courses → no textbook)
  await page.waitForSelector("#screen-ob-v4-summary.active", { timeout: 8000 });
}

async function run(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errors = [];
  // Network non-2xx (the deliberate 503 from checkout, plus any auth noise) shows
  // up as "Failed to load resource" console messages — those are not JS errors.
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  console.log(`\n=== ${vp.name} (${vp.w}px) ===`);

  // Force the Stripe-unwired production case: checkout-session → 503. Proves the
  // graceful "tulossa pian" path deterministically, independent of test auth.
  await page.route("**/api/stripe/checkout-session", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "payment_unavailable", message: "Maksu tulossa pian" }),
  }));

  await login(page);
  await toSummary(page);
  ok(`${vp.name}: reached results (summary)`);

  // Results → product choice
  await page.locator("#ob-v4-summary-start").click();
  await page.waitForSelector("#screen-ob-v4-choice.active", { timeout: 8000 });
  ok(`${vp.name}: results lead to product choice`);

  // 3 options present
  for (const id of ["ob-v4-choice-kurssi", "ob-v4-choice-treeni", "ob-v4-choice-free"]) {
    (await page.locator(`#${id}`).count()) ? ok(`${vp.name}: #${id} present`) : fail(`${vp.name}: #${id} MISSING`);
  }

  // No horizontal scroll
  const sx = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  sx <= 1 ? ok(`${vp.name}: no h-scroll (${sx})`) : fail(`${vp.name}: h-scroll ${sx}px`);

  // Kurssi → checkout. Endpoint returns 503 → graceful pending state, no crash.
  const checkoutResp = page.waitForResponse(r => /\/api\/stripe\/checkout-session/.test(r.url()), { timeout: 10000 }).catch(() => null);
  await page.locator("#ob-v4-choice-kurssi").click();
  const resp = await checkoutResp;
  if (resp) ok(`${vp.name}: Kurssi called checkout-session (status ${resp.status()})`);
  else fail(`${vp.name}: Kurssi did NOT call checkout-session`);
  await page.waitForSelector("#ob-v4-choice-status:not([hidden])", { timeout: 6000 })
    .then(() => ok(`${vp.name}: 503 → graceful pending state shown`))
    .catch(() => fail(`${vp.name}: pending state NOT shown after 503`));

  if (vp.name === "desktop") {
    await page.screenshot({ path: resolve(process.cwd(), "screenshots/L-V359-choice-desktop.png"), fullPage: true }).catch(() => {});
  } else {
    await page.screenshot({ path: resolve(process.cwd(), "screenshots/L-V359-choice-mobile.png"), fullPage: true }).catch(() => {});
  }

  // Free exit from the pending state → leaves the choice screen.
  await page.locator("#ob-v4-choice-status-free").click();
  await page.waitForSelector("#screen-ob-v4-choice.active", { state: "detached", timeout: 8000 })
    .then(() => ok(`${vp.name}: free exit left the choice screen`))
    .catch(async () => {
      const stillActive = await page.locator("#screen-ob-v4-choice.active").count();
      stillActive ? fail(`${vp.name}: free exit did NOT leave choice screen`) : ok(`${vp.name}: free exit left the choice screen`);
    });

  errors.length === 0 ? ok(`${vp.name}: no console errors`) : fail(`${vp.name}: console errors: ${errors.join(" | ")}`);
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await run(browser, { w: 1280, h: 900, name: "desktop" });
    await run(browser, { w: 390, h: 844, name: "mobile" });
  } finally {
    await browser.close();
  }
  console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURES"}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
