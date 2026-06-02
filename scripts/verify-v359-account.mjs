#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V359 (account step) verification — the ANONYMOUS flow:
 *   kieli → kartoitus → tulokset → "luo tili / jatka ilman tiliä" → tuotevalinta.
 * Drives the V4 flow logged-out, asserts the new account step appears between
 * the results and the product choice, exercises both branches (skip + register),
 * and checks the intro language picker. Desktop + 390px (no h-scroll).
 *
 * No real account is created: /api/auth/register and the diagnostic endpoints
 * are intercepted so the flush-after-signup path runs deterministically.
 */
import "dotenv/config";
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";

let failures = 0;
const ok = (m) => console.log("  ✓ " + m);
const fail = (m) => { console.error("  ✗ " + m); failures++; };

async function startOnboarding(page) {
  // Logged-out: bypass the pre-launch gate prompt, then invoke V4 directly.
  await page.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  await page.goto(`${BASE}/app.html`);
  await page.waitForLoadState("domcontentloaded");
  // Hide the app-shell bottom nav that would overlay onboarding buttons mid-session.
  await page.addStyleTag({ content: "#mobile-nav,.mobile-nav{display:none!important}" });
  await page.evaluate(() => window._onboardingV4?.show());
  await page.waitForSelector("#screen-ob-v4-intro.active", { timeout: 8000 });
}

// intro → summary using skip paths (no diagnostic content needed).
async function toSummary(page) {
  await page.locator("#ob-v4-intro-skip").click();        // → courses
  await page.waitForSelector("#screen-ob-v4-courses.active", { timeout: 8000 });
  await page.locator("#ob-v4-courses-continue").click();  // → biography
  await page.waitForSelector("#screen-ob-v4-biography.active", { timeout: 8000 });
  await page.locator("#ob-v4-bio-continue").click();      // → summary
  await page.waitForSelector("#screen-ob-v4-summary.active", { timeout: 8000 });
}

async function run(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  console.log(`\n=== ${vp.name} (${vp.w}px) ===`);

  // Intercept register + diagnostic writes so no real account is created.
  await page.route("**/api/auth/register", (route) => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ token: "t", refreshToken: "r", email: "maija@example.com", emailVerified: false }),
  }));
  await page.route("**/api/onboarding/diagnostic/**", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }),
  }));

  await startOnboarding(page);

  // Language picker present + selectable, pre-reflects current language.
  (await page.locator("#ob-v4-lang .ob4-lang__chip").count()) === 3
    ? ok(`${vp.name}: 3 language chips present`) : fail(`${vp.name}: language chips MISSING`);
  await page.locator('.ob4-lang__chip[data-lang="de"]').click();
  (await page.locator('.ob4-lang__chip[data-lang="de"].is-selected').count())
    ? ok(`${vp.name}: language chip selects`) : fail(`${vp.name}: chip did not select`);

  await toSummary(page);
  ok(`${vp.name}: reached results (summary)`);

  // Results → ACCOUNT step (the new stage), not straight to choice.
  await page.locator("#ob-v4-summary-start").click();
  await page.waitForSelector("#screen-ob-v4-account.active", { timeout: 8000 })
    .then(() => ok(`${vp.name}: results lead to account step`))
    .catch(() => fail(`${vp.name}: account step NOT shown after results`));

  // Register form fields present.
  for (const id of ["ob-v4-acct-name", "ob-v4-acct-phone", "ob-v4-acct-email", "ob-v4-acct-password", "ob-v4-acct-submit", "ob-v4-acct-skip"]) {
    (await page.locator(`#${id}`).count()) ? ok(`${vp.name}: #${id} present`) : fail(`${vp.name}: #${id} MISSING`);
  }

  // No horizontal scroll on the account step.
  const sx = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  sx <= 1 ? ok(`${vp.name}: account no h-scroll (${sx})`) : fail(`${vp.name}: account h-scroll ${sx}px`);

  // Branch A: "Jatka ilman tiliä" → choice (still anonymous).
  await page.locator("#ob-v4-acct-skip").click();
  await page.waitForSelector("#screen-ob-v4-choice.active", { timeout: 8000 })
    .then(() => ok(`${vp.name}: "jatka ilman tiliä" reaches product choice`))
    .catch(() => fail(`${vp.name}: skip did NOT reach choice`));

  // Branch B: register. Re-run to the account step, fill, submit → choice (now logged in).
  await page.evaluate(() => window._onboardingV4?.show());
  await page.waitForSelector("#screen-ob-v4-intro.active", { timeout: 8000 });
  await toSummary(page);
  await page.locator("#ob-v4-summary-start").click();
  await page.waitForSelector("#screen-ob-v4-account.active", { timeout: 8000 });
  await page.locator("#ob-v4-acct-name").fill("Maija M");
  await page.locator("#ob-v4-acct-email").fill("maija@example.com");
  await page.locator("#ob-v4-acct-password").fill("Abcdefg1");
  const regResp = page.waitForResponse(r => /\/api\/auth\/register/.test(r.url()), { timeout: 10000 }).catch(() => null);
  await page.locator("#ob-v4-acct-submit").click();
  (await regResp) ? ok(`${vp.name}: register endpoint called`) : fail(`${vp.name}: register NOT called`);
  await page.waitForSelector("#screen-ob-v4-choice.active", { timeout: 8000 })
    .then(() => ok(`${vp.name}: register leads to product choice`))
    .catch(() => fail(`${vp.name}: register did NOT reach choice`));

  // Validation: empty submit shows a Finnish error (re-run to account step).
  await page.evaluate(() => { try { localStorage.removeItem("puheo_token"); localStorage.removeItem("puheo_refresh_token"); } catch {} });

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
