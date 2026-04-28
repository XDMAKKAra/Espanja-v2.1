// Loop 37c — figure out why clicks on the settings edit buttons hit app-main
// instead of reaching the button itself.
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
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
});

await page.route("**/api/profile", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: PROFILE }) }));
await page.route("**/api/auth/me", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, pro: false }) }));
await page.route("**/api/dashboard", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ totalSessions: 8, modeStats: {}, recent: [], streak: 1, weekSessions: 2, estLevel: "B", pro: false, chartData: [] }) }));
await page.route("**/api/learning-path", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }));
await page.route("**/api/sr/**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/placement/**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1500);

// Click sidebar nav.
await page.click("#nav-settings");
await page.waitForTimeout(800);

// Deep stack probe at the centre of the first edit button.
const probe = await page.evaluate(() => {
  const screens = Array.from(document.querySelectorAll(".screen")).map((s) => ({
    id: s.id,
    active: s.classList.contains("active"),
    display: getComputedStyle(s).display,
    zIndex: getComputedStyle(s).zIndex,
    pointerEvents: getComputedStyle(s).pointerEvents,
    rect: s.getBoundingClientRect().toJSON(),
  }));

  const btn = document.querySelector('.settings-row-edit[data-field="exam_date"]');
  const r = btn?.getBoundingClientRect();
  const cx = r ? r.left + r.width/2 : 0;
  const cy = r ? r.top + r.height/2 : 0;
  // Walk through all elements stacked at that point.
  const stack = document.elementsFromPoint(cx, cy).map((el) => ({
    tag: el.tagName,
    id: el.id,
    cls: el.className,
    z: getComputedStyle(el).zIndex,
    pos: getComputedStyle(el).position,
    pe: getComputedStyle(el).pointerEvents,
  }));

  return {
    btnRect: r ? r.toJSON() : null,
    btnVisible: r ? r.width > 0 && r.height > 0 : false,
    btnPointerEvents: btn ? getComputedStyle(btn).pointerEvents : null,
    btnZ: btn ? getComputedStyle(btn).zIndex : null,
    btnPos: btn ? getComputedStyle(btn).position : null,
    activeScreens: screens.filter((s) => s.active).map((s) => s.id),
    nonHiddenScreens: screens.filter((s) => s.display !== "none").map((s) => ({ id: s.id, z: s.zIndex, rect: s.rect })),
    stack,
  };
});

console.log(JSON.stringify(probe, null, 2));

await ctx.close();
await browser.close();
