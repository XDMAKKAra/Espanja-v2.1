// E2E — visual regression baselines.
//
// Closes the Pass 1 Gate D Commit 11 TODO: the Playwright visual harness
// landed locally but was not wired into CI. This spec establishes the
// canonical baseline set under tests/__screenshots__/ (Playwright default)
// and runs under `npm run test:visual`.
//
// Baselines are OS-specific. CI runs Linux; local runs (Windows/macOS)
// will diff. To avoid cross-OS flakes, we only enforce baselines when
// VISUAL_BASELINE=1 is set. CI sets this; local dev doesn't.
//
// Updating baselines: npm run test:visual:update

import { test, expect } from "@playwright/test";

const ENFORCE = process.env.VISUAL_BASELINE === "1";

test.describe("visual regression — key surfaces", () => {
  test.skip(!ENFORCE, "visual baselines enforced only when VISUAL_BASELINE=1");

  test("landing page — above the fold", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Disable animations so the screenshot is deterministic
    await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;transition:none!important}` });
    await expect(page).toHaveScreenshot("landing-above-fold.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("pricing page", async ({ page }) => {
    await page.goto("/pricing.html");
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;transition:none!important}` });
    await expect(page).toHaveScreenshot("pricing.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("app shell — auth screen", async ({ page }) => {
    await page.goto("/app.html");
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;transition:none!important}` });
    await expect(page.locator("#screen-auth")).toHaveScreenshot("app-auth.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("offline fallback page", async ({ page }) => {
    await page.goto("/offline.html");
    await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;transition:none!important}` });
    await expect(page).toHaveScreenshot("offline.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
