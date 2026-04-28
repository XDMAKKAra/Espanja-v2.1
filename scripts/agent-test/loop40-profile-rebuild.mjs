// Loop 40 — verify the rebuilt profile fits in one viewport at 1440x900
// and that the chip Edit buttons open the settings modal.
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
const PAYLOAD = {
  totalSessions: 47, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
  recent: [
    { mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(Date.now() - 60_000).toISOString() },
    { mode: "grammar", level: "C", scoreCorrect: 8,  scoreTotal: 10, createdAt: new Date(Date.now() - 1800_000).toISOString() },
    { mode: "vocab",   level: "B", scoreCorrect: 9,  scoreTotal: 12, createdAt: new Date(Date.now() - 86400_000).toISOString() },
  ],
  streak: 11, weekSessions: 6, prevWeekSessions: 4, estLevel: "C",
  pro: true, aiUsage: null, chartData: [],
};

const VIEWS = [{ w: 1440, h: 900 }, { w: 375, h: 812 }];

for (const v of VIEWS) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.addInitScript(() => { localStorage.setItem("puheo_token", "mock"); localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com"); });
  const route = (p, body) => page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
  await route("**/api/profile", { profile: PROFILE });
  await route("**/api/auth/me", { ok: true, pro: true });
  await route("**/api/dashboard", PAYLOAD);
  await route("**/api/learning-path", { path: [
    { key: "ser_estar", status: "mastered", bestPct: 0.92, label: "Ser/Estar", short: "S/E" },
    { key: "subjunctive", status: "in_progress", bestPct: 0.55, label: "Subjunktiivi", short: "Subj" },
    { key: "preterite", status: "in_progress", bestPct: 0.42, label: "Preteriti", short: "Pret" },
    { key: "verbs", status: "available", bestPct: 0.20, label: "Verbit", short: "Verb" },
  ] });
  await route("**/api/sr/**", {});
  await route("**/api/placement/**", { needed: false });

  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.click("#nav-profile, .sidebar-user").catch(async () => {
    await page.evaluate(async () => {
      const m = await import("/js/screens/profile.js");
      await m.loadProfile();
    });
  });
  await page.waitForTimeout(1200);

  // Probe layout
  const probe = await page.evaluate((vh) => {
    const inner = document.querySelector(".profile-inner");
    const chips = document.querySelectorAll(".profile-chip-edit").length;
    const r = inner?.getBoundingClientRect();
    return {
      profileBottom: r ? Math.round(r.bottom) : null,
      viewportH: vh,
      fitsAboveFold: r ? r.bottom <= vh : false,
      chipCount: chips,
    };
  }, v.h);
  console.log(`viewport ${v.w}x${v.h}:`, JSON.stringify(probe));

  await page.screenshot({ path: path.join(OUT, `loop-40-profile-${v.w}.png`), fullPage: false });

  if (v.w === 1440) {
    // Click first chip Edit and confirm modal opens
    await page.click('.profile-chip-edit[data-field="exam_date"]');
    await page.waitForTimeout(400);
    const modal = await page.evaluate(() => ({
      hidden: document.getElementById("settings-modal-overlay")?.classList.contains("hidden"),
      title: document.getElementById("settings-modal-title")?.textContent,
    }));
    console.log("CHIP CLICK:", JSON.stringify(modal));
    await page.screenshot({ path: path.join(OUT, "loop-40-chip-modal.png"), fullPage: false });
  }

  await ctx.close();
  await browser.close();
}
