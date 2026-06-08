// L-V403 — landing "Aloita" CTAs route to the placement flow (#/aloitus),
// not straight to signup (#rekisteroidy / #screen-auth). Registration only
// gets asked after the user has seen the summary.
//
// Verifies, logged OUT:
//  - main landing CTAs (nav, hero, footer) land on the V4 intro, not auth
//  - the placement test actually starts from the intro
//  - a per-language landing (saksa) preselects de in the placement intro
//  - the hero offer-card tab choice (fr) carries into the placement intro
//  - no uncaught JS errors across the whole path
//
// Gate: addInitScript sets puheo_gate_ok_v1 so the pre-launch prompt is skipped.

import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || process.env.PUHEO_E2E_BASE || "http://localhost:3000";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
  await page.setViewportSize({ width: 1440, height: 900 });
});

// Collect uncaught exceptions for the whole test; assert zero at the end.
function trackPageErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("index hero CTA → placement intro (not auth), and the test starts", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto(`${BASE}/`);
  await page.locator("#hero .hero__ctas a.btn--primary").click();

  await expect(page).toHaveURL(/\/app\.html#\/aloitus$/);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);
  await expect(page.locator("#screen-auth")).not.toHaveClass(/active/);

  // Placement test actually starts.
  await page.locator("#ob-v4-intro-start").click();
  await expect(page.locator("#screen-ob-v4-test")).toHaveClass(/active/);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("index nav + footer 'Aloita ilmaiseksi' both route to placement", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.locator("#nav-signup").click();
  await expect(page).toHaveURL(/\/app\.html#\/aloitus$/);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);

  await page.goto(`${BASE}/`);
  await page.locator(".cta-card__btn").click();
  await expect(page).toHaveURL(/\/app\.html#\/aloitus$/);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);
});

test("per-language landing (saksa) preselects de in the placement intro", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto(`${BASE}/saksan-abikurssi`);
  await page.locator("#nav-signup").click();

  await expect(page).toHaveURL(/\/app\.html#\/aloitus$/);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);
  await expect(page.locator('.ob4-lang__chip[data-lang="de"]')).toHaveClass(/is-selected/);
  const lang = await page.evaluate(() => localStorage.getItem("puheo:lang"));
  expect(lang).toBe("de");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("hero offer-card 'Ranska' tab + 'Aloita nyt' carries fr into placement", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.locator('#hero-lang-switch button[data-lang="fr"]').click();
  await page.locator("#hero-offer .offer-card__cta").click();

  await expect(page).toHaveURL(/\/app\.html#\/aloitus$/);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);
  await expect(page.locator('.ob4-lang__chip[data-lang="fr"]')).toHaveClass(/is-selected/);
  const lang = await page.evaluate(() => localStorage.getItem("puheo:lang"));
  expect(lang).toBe("fr");
});
