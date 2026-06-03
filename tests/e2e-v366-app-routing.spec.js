// L-V366 — guards for two app-shell routing regressions:
//   BUG-2: #/sanasto and #/puheoppi (deleted mode pages) used to fall through
//          to the Asetukset view. They must now fold onto Tehtävät.
//   BUG-3: the active sidebar pill must follow the route, not the last click.
//
// Routing is wired during main.js module-eval (the hashchange listener), so
// these assertions don't depend on the authed boot flow succeeding — we only
// need isLoggedIn() to be true, which the fake token below provides.

import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_token", "test-token-v366");
      localStorage.setItem("puheo_email", "v366@test.dev");
    } catch {}
  });
  await page.goto("/app.html");
  await page.waitForLoadState("domcontentloaded");
});

test("BUG-2: #/sanasto redirects to Tehtävät, never Asetukset", async ({ page }) => {
  await page.evaluate(() => { location.hash = "#/sanasto"; });
  await expect(page).toHaveURL(/#\/oppimispolku/);
  await expect(page.locator("#screen-settings")).not.toHaveClass(/\bactive\b/);
  await expect(page.locator("#nav-settings")).not.toHaveClass(/\bactive\b/);
  await expect(page.locator("#nav-oppimispolku")).toHaveClass(/\bactive\b/);
});

test("BUG-2: #/puheoppi redirects to Tehtävät, never Asetukset", async ({ page }) => {
  await page.evaluate(() => { location.hash = "#/puheoppi"; });
  await expect(page).toHaveURL(/#\/oppimispolku/);
  await expect(page.locator("#screen-settings")).not.toHaveClass(/\bactive\b/);
  await expect(page.locator("#nav-settings")).not.toHaveClass(/\bactive\b/);
});

test("BUG-3: navigating to Tehtävät activates Tehtävät, not Koti", async ({ page }) => {
  await page.evaluate(() => { location.hash = "#/aloitus"; });
  await expect(page.locator("#nav-home")).toHaveClass(/\bactive\b/);

  await page.evaluate(() => { location.hash = "#/oppimispolku"; });
  await expect(page.locator("#nav-oppimispolku")).toHaveClass(/\bactive\b/);
  await expect(page.locator("#nav-home")).not.toHaveClass(/\bactive\b/);
});

test("BUG-3: direct deep-load of #/oma-sivu activates Profiili", async ({ page }) => {
  await page.evaluate(() => { location.hash = "#/oma-sivu"; });
  await expect(page.locator("#nav-profile")).toHaveClass(/\bactive\b/);
  await expect(page.locator("#nav-home")).not.toHaveClass(/\bactive\b/);
});
