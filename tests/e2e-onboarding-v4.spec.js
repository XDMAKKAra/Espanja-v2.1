// L-V293-ONBOARDING-DIAGNOSTIC-1a — V4 onboarding e2e spec (skippaus + multi-select).
//
// Scope: Commit 1a infra only. Verifies that the V4 screens render, navigation
// between stepit works, multi-select courses + grade selection update state,
// biography radios persist, and skip-all routes correctly. Content rendering
// (real Part A/B/C questions) is tested in L-V293-1b+.

import { test, expect } from "@playwright/test";

const BASE = process.env.PUHEO_E2E_BASE || "http://localhost:3000";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
    try { localStorage.setItem("puheo:lang", "es"); } catch {}
  });
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("V4 intro renders with title, primary CTA, and skip link", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await expect(page.locator("#screen-ob-v4-intro")).toHaveClass(/active/);
  await expect(page.locator("#screen-ob-v4-intro h1.ob4-title")).toContainText(/Räätälöidään/i);
  await expect(page.locator("#ob-v4-intro-start")).toBeVisible();
  await expect(page.locator("#ob-v4-intro-skip")).toBeVisible();
});

test("V4 intro skip routes to courses step", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  await expect(page.locator("#screen-ob-v4-courses")).toHaveClass(/active/);
  await expect(page.locator("#screen-ob-v4-courses h1.ob4-title")).toContainText(/lukio-kursseja/i);
});

test("V4 intro start routes to test step and shows empty-state for placeholder content", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  await expect(page.locator("#screen-ob-v4-test")).toHaveClass(/active/);
  await expect(page.locator("#ob-v4-test-part-label")).toContainText(/Osa A/);
  await expect(page.locator("#ob-v4-test-body")).toContainText(/sisältö on vielä työn alla|tulossa/i);
});

test("V4 test skip-all routes to courses step", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-start").click();
  await page.locator("#ob-v4-test-skip-all").click();
  await expect(page.locator("#screen-ob-v4-courses")).toHaveClass(/active/);
});

test("V4 multi-select courses + non-consecutive grades, then biography", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();

  await page.locator("#ob-v4-c3").check();
  await page.locator("#ob-v4-c6").check();
  await page.locator('select[data-course-num="3"]').selectOption("8");
  await page.locator('select[data-course-num="6"]').selectOption("7");

  await expect(page.locator('.ob4-course[data-course="3"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.ob4-course[data-course="6"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.ob4-course[data-course="1"]')).not.toHaveClass(/is-selected/);

  await page.locator("#ob-v4-courses-continue").click();
  await expect(page.locator("#screen-ob-v4-biography")).toHaveClass(/active/);
});

test("V4 biography → summary → start dashboard link", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  await page.locator("#ob-v4-intro-skip").click();
  await page.locator("#ob-v4-courses-continue").click();

  await page.locator('input[name="home_usage"][value="some"]').check();
  await page.locator('input[name="lived_abroad"][value="vacations"]').check();
  await page.locator('input[name="frequency"][value="weekly"]').check();
  await page.locator("#ob-v4-bio-continue").click();

  await expect(page.locator("#screen-ob-v4-summary")).toHaveClass(/active/);
  await expect(page.locator("#ob-v4-summary-recap")).toBeVisible();
});

test("V4 no italic + no Fraunces in onboarding chrome (anti-slop)", async ({ page }) => {
  await page.goto(`${BASE}/app.html#/aloitus-v4`);
  const italics = await page.evaluate(() => {
    const ob4 = document.querySelectorAll("#screen-ob-v4-intro h1, #screen-ob-v4-intro p, #screen-ob-v4-intro button");
    return Array.from(ob4).filter(el => window.getComputedStyle(el).fontStyle === "italic").length;
  });
  expect(italics).toBe(0);

  const fraunces = await page.evaluate(() => {
    const ob4 = document.querySelectorAll("#screen-ob-v4-intro *");
    return Array.from(ob4).filter(el => window.getComputedStyle(el).fontFamily.toLowerCase().includes("fraunces")).length;
  });
  expect(fraunces).toBe(0);
});
