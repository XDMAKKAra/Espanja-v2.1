// L-V409 — Oppimispolku purchase-lock verification.
//
// Confirms that:
//   1. Free user sees buy-locked rows + buy banner (not progress-locked rows)
//   2. Treeni user sees buy-locked rows (upgrade variant)
//   3. Kurssi user sees normal rows (no buy-lock)
//   4. Progress-lock ("Avautuu vuorollaan") still works for kurssi users
//   5. Buy-locked row click triggers paywall modal
//   6. No horizontal scroll at 390px
//
// Uses the same stub+gate pattern as e2e-v377.

import { test, expect } from "@playwright/test";

const HOME_URL = "http://localhost:3000/app.html#/aloitus";
const OP_URL = "http://localhost:3000/app.html#/oppimispolku?lang=es";

const CURRICULUM_BUY = {
  kurssit: [
    { key: "kurssi_1", title: "Kuka olen", description: "Esittely ja perusteet", level: "I",
      isUnlocked: true, kertausPassed: false, lessonCount: 10, lessonsCompleted: 2, _stepNumber: 1 },
    { key: "kurssi_2", title: "Arki", description: "Arkirutiinit", level: "A",
      isUnlocked: false, kertausPassed: false, lessonCount: 10, lessonsCompleted: 0, _stepNumber: 2 },
    { key: "kurssi_3", title: "Menneisyys", description: "Imperfekti ja pretérito", level: "B",
      isUnlocked: false, kertausPassed: false, lessonCount: 10, lessonsCompleted: 0, _stepNumber: 3 },
  ],
};

function dashPayload(tier) {
  const profileTier = tier === "kurssi" ? "mestari" : tier === "treeni" ? "treeni" : "free";
  const status = tier === "free" ? "" : "active";
  return {
    profile: { profile: { subscription_tier: profileTier, subscription_status: status, preferred_name: "Testi" } },
    dashboard: {
      totalSessions: 10, streak: 3, recent: [],
      weekSessions: 3, prevWeekSessions: 2, estLevel: "B",
      gradeEstimate: { tier: "estimated", grade: "B", confidence: 3, total: 40 },
      modeStats: {}, modeDaysAgo: {}, pro: tier !== "free",
    },
    learningPath: { path: [], totalTopics: 14, masteredCount: 0, currentIndex: 0 },
    weakTopics: { topics: [] },
  };
}

async function stubOp(page, tier) {
  const profileTier = tier === "kurssi" ? "mestari" : tier === "treeni" ? "treeni" : "free";
  const status = tier === "free" ? "" : "active";
  // Inject _userProfile directly so getTier() resolves correctly even when
  // loadDashboard hasn't been called yet (direct navigation to #/oppimispolku).
  await page.addInitScript(({ profileTier, status }) => {
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_token", "test-token-v409");
    localStorage.setItem("puheo_email", "test@example.com");
    localStorage.setItem("puheo:enabled-langs", JSON.stringify(["es"]));
    localStorage.setItem("puheo:lang", "es");
    window._userProfile = { subscription_tier: profileTier, subscription_status: status, preferred_name: "Testi" };
  }, { profileTier, status });
  await page.route("**/api/dashboard/v2**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashPayload(tier)) }));
  // Stub /api/profile so getProfile() fallback in loadOppimispolkuIndex works.
  await page.route("**/api/profile", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { subscription_tier: profileTier, subscription_status: status, preferred_name: "Testi" } }) }));
  await page.route("**/api/curriculum?*", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CURRICULUM_BUY) }));
  await page.route("**/api/curriculum/*", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ lessons: [] }) }));
  await page.route("**/api/personalization/next-topic", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ topic: "ser_estar", source: "uniform" }) }));
}

// Navigate to home first to let checkOnboarding + loadDashboard set _userProfile,
// then click into oppimispolku so the screen renders correctly.
async function gotoOp(page) {
  await page.goto(HOME_URL, { waitUntil: "networkidle" });
  // Wait for home screen to appear (means auth + dashboard have resolved).
  await page.waitForSelector("#screen-home", { timeout: 20000 }).catch(() => {});
  // Navigate to oppimispolku via hash change.
  await page.evaluate(() => { location.hash = "#/oppimispolku?lang=es"; });
  await page.waitForSelector(".lp-list", { timeout: 15000 });
}

// ─── Free user ──────────────────────────────────────────────────────────────

test("free: kaikki rivit ovat buy-locked, ei progress-locked", async ({ page }) => {
  await stubOp(page, "free");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);

  const buyLocked = page.locator(".lp-row--buy-locked");
  const progressLocked = page.locator(".lp-row--locked:not(.lp-row--buy-locked)");
  await expect(buyLocked).toHaveCount(3);
  await expect(progressLocked).toHaveCount(0);
});

test("free: buy-banner näkyy", async ({ page }) => {
  await stubOp(page, "free");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  await expect(page.locator(".lp-buy-banner")).toContainText("Kurssi");
  await expect(page.locator(".lp-buy-banner__btn")).toBeVisible();
});

test("free: buy-locked rivissä näkyy Avaa Kurssilla", async ({ page }) => {
  await stubOp(page, "free");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  await expect(page.locator(".lp-row--buy-locked").first()).toContainText("Avaa Kurssilla");
});

test("free: buy-locked rivin klikkaus avaa paywall-modal", async ({ page }) => {
  await stubOp(page, "free");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  // Paywall-modal might navigate or show modal
  await page.locator(".lp-row--buy-locked").first().click();
  // Either modal is shown or navigation to pricing happens
  await page.waitForTimeout(1000);
  const hasModal = await page.locator("#paywall-modal:not([hidden])").count();
  const hasPricingNav = page.url().includes("pricing");
  expect(hasModal > 0 || hasPricingNav).toBe(true);
});

test("free 390px: ei vaakavieritystä", async ({ page }) => {
  await stubOp(page, "free");
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoOp(page);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px tolerance
});

// ─── Treeni user ─────────────────────────────────────────────────────────────

test("treeni: kaikki rivit ovat buy-locked (upgrade-variant)", async ({ page }) => {
  await stubOp(page, "treeni");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  const buyLocked = page.locator(".lp-row--buy-locked");
  await expect(buyLocked).toHaveCount(3);
});

// ─── Kurssi user ──────────────────────────────────────────────────────────────

test("kurssi: ei buy-locked rivejä", async ({ page }) => {
  await stubOp(page, "kurssi");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  const buyLocked = page.locator(".lp-row--buy-locked");
  await expect(buyLocked).toHaveCount(0);
  // First row active (isUnlocked=true), second and third progress-locked
  const progressLocked = page.locator(".lp-row--locked");
  await expect(progressLocked).toHaveCount(2);
});

test("kurssi: normaali aktiivinen rivi näkyy oikein", async ({ page }) => {
  await stubOp(page, "kurssi");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  await expect(page.locator(".lp-row--active")).toHaveCount(1);
  await expect(page.locator(".lp-row--active")).toContainText("Kuka olen");
});

test("kurssi: progress-locked rivi näyttää Avautuu vuorollaan", async ({ page }) => {
  await stubOp(page, "kurssi");
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoOp(page);
  await expect(page.locator(".lp-row--locked").first()).toContainText("Avautuu vuorollaan");
});
