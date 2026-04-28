// Smoke test all 8 settings fields open the modal via real mouse clicks.
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const PROFILE = {
  onboarding_completed: true, starting_level: "B", current_grade: "B",
  exam_date: "2027-03-15", spanish_courses_completed: 4, spanish_grade_average: 8,
  study_background: "lukio", weak_areas: ["subjunctive"], strong_areas: ["vocabulary"],
  preferred_session_length: 20, target_grade: "M", weekly_goal_minutes: 140,
};
const FIELDS = ["exam_date", "spanish_courses_completed", "spanish_grade_average", "study_background", "weak_areas", "strong_areas", "preferred_session_length", "target_grade"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.addInitScript(() => { localStorage.setItem("puheo_token", "mock"); localStorage.setItem("puheo_email", "ronja@x.fi"); });
const route = (p, body) => page.route(p, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
await route("**/api/profile", { profile: PROFILE });
await route("**/api/auth/me", { ok: true, pro: false });
await route("**/api/dashboard", { totalSessions: 0, modeStats: {}, recent: [], streak: 0, weekSessions: 0, estLevel: "B", pro: false, chartData: [] });
await route("**/api/learning-path", { path: [] });
await route("**/api/sr/**", {});
await route("**/api/placement/**", { needed: false });
await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.click("#nav-settings");
await page.waitForTimeout(800);

const results = [];
for (const f of FIELDS) {
  // Close any open modal first.
  await page.evaluate(() => document.getElementById("settings-modal-overlay")?.classList.add("hidden"));
  // Get button center.
  const c = await page.evaluate((field) => {
    const b = document.querySelector(`.settings-row-edit[data-field="${field}"]`);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }, f);
  if (!c) { results.push({ field: f, error: "btn-not-found" }); continue; }
  await page.mouse.click(c.x, c.y);
  await page.waitForTimeout(120);
  const r = await page.evaluate(() => ({
    hidden: document.getElementById("settings-modal-overlay")?.classList.contains("hidden"),
    title: document.getElementById("settings-modal-title")?.textContent,
    optCount: document.querySelectorAll("#settings-modal-body .settings-opt").length,
  }));
  results.push({ field: f, opened: !r.hidden, title: r.title, opts: r.optCount });
}

console.log("RESULTS:", JSON.stringify(results, null, 2));
const allOpened = results.every((r) => r.opened === true);
await ctx.close();
await browser.close();
process.exit(allOpened ? 0 : 1);
