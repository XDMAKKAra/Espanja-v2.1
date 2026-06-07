// L-V377 — Koti launchpad redesign contract.
//
// Verifies the council asks: no zero-state greeting, exactly one dominant
// Jatka that resolves a task in one tap, streak + daily goal visible, and the
// tier differences (free wall + blurred grade teaser, kurssi course progress).
//
// The dashboard + curriculum endpoints are stubbed so the test drives tiers
// without a real Supabase session.

import { test, expect } from "@playwright/test";

const URL = "http://localhost:3000/app.html#/aloitus";
const TODAY = new Date().toISOString();

function dashboardPayload({ tier = "free", streak = 4, todayTasks = 1, grade = "M" } = {}) {
  const recent = Array.from({ length: todayTasks }, (_, i) => ({
    mode: "vocab", level: "M", scoreCorrect: 8, scoreTotal: 10, ytlGrade: grade, createdAt: TODAY,
  }));
  const profileTier = tier === "kurssi" ? "mestari" : tier === "treeni" ? "treeni" : "free";
  const status = tier === "free" ? "" : "active";
  return {
    profile: { profile: { subscription_tier: profileTier, subscription_status: status, preferred_name: "Aino" } },
    dashboard: {
      totalSessions: 24, streak, recent, weekSessions: 6, prevWeekSessions: 4,
      estLevel: grade, gradeEstimate: { tier: "estimated", grade, confidence: 3, total: 40 },
      modeStats: {}, modeDaysAgo: {}, pro: tier !== "free",
    },
    learningPath: { path: [], totalTopics: 14, masteredCount: 3, currentIndex: 3 },
    weakTopics: { topics: [] },
  };
}

const CURRICULUM = {
  kurssit: [
    { key: "kurssi_1", title: "Kuka olen", description: "", level: "I", isUnlocked: true, kertausPassed: false, lessonCount: 10, lessonsCompleted: 1, _stepNumber: 1 },
    { key: "kurssi_2", title: "Arki", description: "", level: "A", isUnlocked: false, kertausPassed: false, lessonCount: 10, lessonsCompleted: 0, _stepNumber: 2 },
  ],
};
const COURSE_DETAIL = {
  lessons: [
    { sortOrder: 1, focus: "Tervehdykset", type: "vocab", completed: true, estimated_minutes: 12 },
    { sortOrder: 2, focus: "Esittäytyminen", type: "grammar", completed: false, estimated_minutes: 14 },
  ],
};

async function stub(page, { tier = "free", todayTasks = 1, streak = 4 } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_token", "test-token-v377");
    localStorage.setItem("puheo_email", "test@example.com");
    localStorage.setItem("puheo:enabled-langs", JSON.stringify(["es"]));
    localStorage.setItem("puheo:lang", "es");
  });
  await page.route("**/api/dashboard/v2**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashboardPayload({ tier, todayTasks, streak })) }));
  await page.route("**/api/curriculum/*", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(COURSE_DETAIL) }));
  await page.route("**/api/curriculum?*", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CURRICULUM) }));
  await page.route("**/api/personalization/next-topic", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ topic: "ser_estar", source: "uniform" }) }));
  await page.setViewportSize({ width: 1440, height: 900 });
}

test("free: launchpad renders without a zero-state greeting", async ({ page }) => {
  await stub(page, { tier: "free", todayTasks: 1, streak: 4 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home .dash-hero");
  const text = (await page.locator("#screen-home").allTextContents()).join(" ");
  expect(text).not.toMatch(/0\s*\/\s*\d+\s*aihetta/);
  expect(text).not.toMatch(/0\s*%\s*hallussa/);
  expect(text).not.toContain("—");
});

test("free: exactly one dominant primary CTA", async ({ page }) => {
  await stub(page, { tier: "free", todayTasks: 1 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home .dash-hero");
  const primary = page.locator("#screen-home [data-cta-primary], #screen-home .cta-primary, #screen-home .btn-primary");
  await expect(primary).toHaveCount(1);
});

test("free: streak pill and daily-goal ring are visible", async ({ page }) => {
  await stub(page, { tier: "free", streak: 5, todayTasks: 1 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home .dash-hero");
  await expect(page.locator(".dash-hero__streak")).toContainText("5");
  await expect(page.locator(".dash-block--goal")).toContainText("/ 3 tehtävää");
  await expect(page.locator(".dash-ring")).toHaveCount(1);
});

test("Jatka resolves to a lesson task in one tap", async ({ page }) => {
  await stub(page, { tier: "free", todayTasks: 1 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home [data-next-task]");
  await page.locator("#screen-home [data-next-task]").click();
  await page.waitForFunction(() => location.hash.startsWith("#/oppitunti/"));
  expect(page.url()).toContain("#/oppitunti/es/kurssi_1/2");
});

test("free: goal met shows the soft wall with a blurred grade teaser", async ({ page }) => {
  await stub(page, { tier: "free", todayTasks: 3 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home .dash-hero");
  await expect(page.locator(".dash-wall")).toHaveCount(1);
  await expect(page.locator(".dash-wall")).toContainText("Treenissä");
  await expect(page.locator(".dash-wall__teaser-grade")).toBeVisible();
});

test("treeni: no wall even when the daily goal is met", async ({ page }) => {
  await stub(page, { tier: "treeni", todayTasks: 3 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home .dash-hero");
  await expect(page.locator(".dash-wall")).toHaveCount(0);
});

test("kurssi: goal slot becomes course progress", async ({ page }) => {
  await stub(page, { tier: "kurssi", todayTasks: 1 });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-home .dash-block--goal");
  await expect(page.locator(".dash-block--goal")).toContainText("Kurssietenemä");
  await expect(page.locator(".dash-block--goal")).toContainText("Kurssi 1 / 2");
});

test("path-journey illustration no longer draws a graduation cap", async ({ page }) => {
  const res = await page.request.get("http://localhost:3000/img/illustrations/path-journey.svg");
  const svg = await res.text();
  expect(svg.toLowerCase()).not.toContain("ylioppilaslakki");
  expect(svg).not.toContain("scale(0.2)"); // the old cap group transform
});
