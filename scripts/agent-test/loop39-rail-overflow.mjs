// Reproduce + screenshot the right sidebar overflow at 1280, 1440, 1920.
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
  totalSessions: 12, modeStats: { vocab: 4, grammar: 3, reading: 3, writing: 2 },
  recent: [
    { mode: "writing", level: "C", scoreCorrect: 25, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(Date.now() - 60_000).toISOString() },
    { mode: "grammar", level: "B", scoreCorrect: 7,  scoreTotal: 10, createdAt: new Date(Date.now() - 3600_000).toISOString() },
  ],
  streak: 3, weekSessions: 4, prevWeekSessions: 2, estLevel: "B",
  pro: false, aiUsage: null, chartData: [],
};

const VIEWS = [
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 },
];

for (const v of VIEWS) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.addInitScript(() => { localStorage.setItem("puheo_token", "mock"); localStorage.setItem("puheo_email", "ronja@x.fi"); });
  const route = (p, body) => page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
  await route("**/api/profile", { profile: PROFILE });
  await route("**/api/auth/me", { ok: true, pro: false });
  await route("**/api/dashboard", PAYLOAD);
  await route("**/api/learning-path", { path: [] });
  await route("**/api/sr/**", {});
  await route("**/api/placement/**", { needed: false });

  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.click("#nav-dashboard").catch(() => {});
  await page.waitForTimeout(1200);

  const measurements = await page.evaluate(() => {
    const rail = document.querySelector(".app-rail");
    const wod = document.getElementById("dash-word-of-day") || document.querySelector(".rail__group--wod, .word-of-day, [class*='word']");
    const railRect = rail?.getBoundingClientRect();
    const wodRect = wod?.getBoundingClientRect();
    const overflow = rail ? getComputedStyle(rail).overflow : null;
    // Walk all rail children, see which exceed the rail's right edge
    const children = rail ? Array.from(rail.querySelectorAll("*")).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > railRect.right + 1 || r.width > railRect.width + 1;
    }).slice(0, 8).map((el) => ({
      tag: el.tagName, cls: typeof el.className === "string" ? el.className.slice(0, 60) : "",
      right: Math.round(el.getBoundingClientRect().right),
      width: Math.round(el.getBoundingClientRect().width),
      text: (el.textContent || "").trim().slice(0, 40),
    })) : [];
    return { railRect: railRect?.toJSON(), wodRect: wodRect?.toJSON(), overflow, overflowingChildren: children };
  });
  console.log(`viewport ${v.w}:`, JSON.stringify(measurements, null, 2));

  await page.screenshot({ path: path.join(OUT, `loop-39-rail-${v.w}.png`), fullPage: false });
  await ctx.close();
  await browser.close();
}
