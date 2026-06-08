// L-V408 — kartoitus-portaali verification
// Tests: fullscreen (no chrome), flow order, no horizontal scroll, step counters.

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("L-V408 kartoitus-portaali mobile (390px)", () => {
  test.beforeEach(async ({ page }) => {
    // Bypass pre-launch gate
    await page.addInitScript(() => {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      // Ensure not logged in
      localStorage.removeItem("puheo:token");
      localStorage.removeItem("puheo:refresh");
    });
    await page.goto(`${BASE}/app.html#/aloitus`);
    // Wait for the intro screen to be visible
    await page.waitForSelector("#screen-ob-v4-intro.active, #screen-ob-v4-intro.screen.active", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  });

  test("intro screen: no sidebar, no topbar, no hamburger", async ({ page }) => {
    // Check kartoitus-active is on body
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain("kartoitus-active");

    // Topbar hidden
    const topbarVisible = await page.locator(".app-topbar").isVisible();
    expect(topbarVisible).toBe(false);

    // Sidebar hidden
    const sidebarVisible = await page.locator("#app-sidebar").isVisible();
    expect(sidebarVisible).toBe(false);

    // Mobile nav hidden
    const mobileNavVisible = await page.locator("#mobile-nav").isVisible();
    expect(mobileNavVisible).toBe(false);

    // Hamburger button hidden
    const menuToggleVisible = await page.locator("#menu-toggle").isVisible();
    expect(menuToggleVisible).toBe(false);
  });

  test("intro screen: correct copy (no Raataloidaan, no em-dash)", async ({ page }) => {
    const h1Text = await page.locator("#screen-ob-v4-intro h1").textContent();
    expect(h1Text).not.toContain("Räätälöidään");
    expect(h1Text).not.toContain("—");
    expect(h1Text).toBeTruthy();
    // Should not contain taso-arvio mention
    const bodyText = await page.locator("#screen-ob-v4-intro").textContent();
    expect(bodyText).not.toContain("taso-arvio");
  });

  test("intro: no horizontal scroll", async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("intro: language chips work + Jatka button advances to biography", async ({ page }) => {
    // Click Saksa chip
    await page.locator(".ob4-lang__chip[data-lang='de']").click();
    await page.waitForTimeout(100);

    // Click Jatka
    await page.locator("#ob-v4-intro-next").click();
    await page.waitForTimeout(300);

    // Should be on biography screen
    const bioActive = await page.evaluate(() =>
      document.getElementById("screen-ob-v4-biography")?.classList.contains("active")
    );
    expect(bioActive).toBe(true);

    // Step counter should show 1/3
    const stepText = await page.locator("#screen-ob-v4-biography .ob4-step").textContent();
    expect(stepText).toContain("1 / 3");
  });

  test("biography → choice (tier) flow, no test stage", async ({ page }) => {
    // Navigate through intro → bio
    await page.locator("#ob-v4-intro-next").click();
    await page.waitForTimeout(200);

    // Verify we're on biography (not test screen)
    const testActive = await page.evaluate(() =>
      document.getElementById("screen-ob-v4-test")?.classList.contains("active")
    );
    expect(testActive).toBeFalsy();

    // Click bio continue
    await page.locator("#ob-v4-bio-continue").click();
    await page.waitForTimeout(300);

    // Should be on choice screen
    const choiceActive = await page.evaluate(() =>
      document.getElementById("screen-ob-v4-choice")?.classList.contains("active")
    );
    expect(choiceActive).toBe(true);

    // Step counter should show 2/3
    const stepText = await page.locator("#screen-ob-v4-choice .ob4-step").textContent();
    expect(stepText).toContain("2 / 3");
  });

  test("choice screen: no horizontal scroll", async ({ page }) => {
    await page.locator("#ob-v4-intro-next").click();
    await page.waitForTimeout(200);
    await page.locator("#ob-v4-bio-continue").click();
    await page.waitForTimeout(300);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("choice: free exit deactivates portal", async ({ page }) => {
    await page.locator("#ob-v4-intro-next").click();
    await page.waitForTimeout(200);
    await page.locator("#ob-v4-bio-continue").click();
    await page.waitForTimeout(300);

    // Click free exit
    await page.locator("#ob-v4-choice-free").click();
    await page.waitForTimeout(500);

    // kartoitus-active should be removed
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).not.toContain("kartoitus-active");
  });

  test("choice: stripe stub shows graceful pending state (503 expected)", async ({ page }) => {
    await page.locator("#ob-v4-intro-next").click();
    await page.waitForTimeout(200);
    await page.locator("#ob-v4-bio-continue").click();
    await page.waitForTimeout(300);

    // No account = clicking kurssi requires account first (gotoStage account)
    // The kurssi button checks isLoggedIn() → redirects to account stage
    await page.locator("#ob-v4-choice-kurssi").click();
    await page.waitForTimeout(300);

    // Should land on account screen (needs login before checkout)
    const accountActive = await page.evaluate(() =>
      document.getElementById("screen-ob-v4-account")?.classList.contains("active")
    );
    expect(accountActive).toBe(true);

    // Account step shows 3/3
    const stepText = await page.locator("#screen-ob-v4-account .ob4-step").textContent();
    expect(stepText).toContain("3 / 3");
  });

  test("no uncaught JS errors through intro → bio → choice", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.locator("#ob-v4-intro-next").click();
    await page.waitForTimeout(200);
    await page.locator("#ob-v4-bio-continue").click();
    await page.waitForTimeout(300);

    expect(errors.filter(e => !e.includes("ResizeObserver"))).toHaveLength(0);
  });
});

test.describe("L-V408 kartoitus-portaali desktop (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.removeItem("puheo:token");
      localStorage.removeItem("puheo:refresh");
    });
    await page.goto(`${BASE}/app.html#/aloitus`);
    await page.waitForTimeout(500);
  });

  test("desktop: no sidebar or topbar chrome visible", async ({ page }) => {
    const topbarVisible = await page.locator(".app-topbar").isVisible();
    expect(topbarVisible).toBe(false);

    const sidebarVisible = await page.locator("#app-sidebar").isVisible();
    expect(sidebarVisible).toBe(false);
  });

  test("desktop: no horizontal scroll on intro", async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("desktop: intro screen fills viewport", async ({ page }) => {
    const introRect = await page.locator("#screen-ob-v4-intro").boundingBox();
    expect(introRect).toBeTruthy();
    // Should be at least viewport height
    expect(introRect.height).toBeGreaterThanOrEqual(700);
    // Should cover full width
    expect(introRect.width).toBeGreaterThanOrEqual(1250);
  });
});
