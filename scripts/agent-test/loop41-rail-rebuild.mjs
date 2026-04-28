// Loop 41 — verify the rebuilt right sidebar (user card + Pro upsell or
// daily peek). Two scenarios: free user → upsell visible; pro user →
// daily panel visible.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PROFILE = {
  onboarding_completed: true, starting_level: "B", current_grade: "B",
  exam_date: "2027-03-15", spanish_courses_completed: 4, spanish_grade_average: 8,
  study_background: "lukio", weak_areas: ["subjunctive"], strong_areas: ["vocabulary"],
  preferred_session_length: 20, target_grade: "M", weekly_goal_minutes: 140,
};

async function run({ pro, label }) {
  const PAYLOAD = {
    totalSessions: 8, modeStats: { vocab: 3, grammar: 2, reading: 2, writing: 1 },
    recent: [], streak: 5, weekSessions: 4, prevWeekSessions: 3,
    estLevel: "C", pro, aiUsage: null, chartData: [],
  };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await page.addInitScript(() => { localStorage.setItem("puheo_token", "mock"); localStorage.setItem("puheo_email", "ronja@x.fi"); });
  const route = (p, body) => page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
  await route("**/api/profile", { profile: PROFILE });
  await route("**/api/auth/me", { ok: true, pro });
  await route("**/api/dashboard", PAYLOAD);
  await route("**/api/learning-path", { path: [
    { key: "ser_estar", status: "in_progress", bestPct: 0.55, label: "Ser/Estar", short: "S/E" },
    { key: "subj", status: "available", bestPct: 0.20, label: "Subjunktiivi", short: "Subj" },
  ] });
  await route("**/api/sr/**", {});
  await route("**/api/placement/**", { needed: false });
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.click("#nav-dashboard").catch(() => {});
  await page.waitForTimeout(1500);

  const probe = await page.evaluate(() => ({
    userCard: !!document.getElementById("rail-user-card"),
    userName: document.getElementById("rail-user-name")?.textContent?.trim(),
    userStreak: document.getElementById("rail-user-streak-num")?.textContent?.trim(),
    proPanelHidden: document.getElementById("rail-panel-pro")?.hidden,
    dailyPanelHidden: document.getElementById("rail-panel-daily")?.hidden,
    upsellTitle: document.querySelector(".rail-upsell-title")?.textContent?.trim(),
    upsellCtaText: document.getElementById("rail-upsell-cta")?.textContent?.trim(),
  }));
  console.log(`${label}:`, JSON.stringify(probe, null, 2));

  // Crop the rail (right 320px column).
  await page.screenshot({ path: path.join(OUT, `loop-41-rail-${label}.png`), clip: { x: 1120, y: 0, width: 320, height: 900 } });

  await ctx.close();
  await browser.close();
}

await run({ pro: false, label: "free" });
await run({ pro: true,  label: "pro" });
