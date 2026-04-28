// Use page.mouse.click(x,y) to bypass Playwright's actionability check and
// see whether a real browser click actually lands on the button.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PROFILE = {
  onboarding_completed: true, starting_level: "B", current_grade: "B",
  exam_date: "2027-03-15", spanish_courses_completed: 4, spanish_grade_average: 8,
  study_background: "lukio", weak_areas: ["subjunctive"], strong_areas: ["vocabulary"],
  preferred_session_length: 20, target_grade: "M", weekly_goal_minutes: 140,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "ronja@x.fi");
});
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

// Get the button's center.
const coords = await page.evaluate(() => {
  const btn = document.querySelector('.settings-row-edit[data-field="exam_date"]');
  const r = btn.getBoundingClientRect();
  return { x: r.left + r.width/2, y: r.top + r.height/2 };
});
console.log("clicking at", coords);

// Capture what fires.
await page.evaluate(() => {
  window.__clickLog = [];
  document.addEventListener("click", (e) => {
    window.__clickLog.push({
      target: e.target.tagName + (e.target.id ? "#"+e.target.id : "") + "." + (e.target.className || ""),
      defaultPrevented: e.defaultPrevented,
    });
  }, true);
});

// Real synthetic mouse click via Playwright's input pipeline.
await page.mouse.click(coords.x, coords.y);
await page.waitForTimeout(300);

const result = await page.evaluate(() => ({
  log: window.__clickLog,
  modalHidden: document.getElementById("settings-modal-overlay")?.classList.contains("hidden"),
  modalTitle: document.getElementById("settings-modal-title")?.textContent,
}));
console.log("RESULT:", JSON.stringify(result, null, 2));

await ctx.close();
await browser.close();
