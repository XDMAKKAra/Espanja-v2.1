// Deep probe: any element in the rail where scrollWidth > clientWidth
// (true horizontal overflow), at all 3 viewports.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PROFILE = {
  onboarding_completed: true, starting_level: "B", current_grade: "B",
  exam_date: "2027-03-15", spanish_courses_completed: 4, spanish_grade_average: 8,
  study_background: "lukio", weak_areas: ["subjunctive"], strong_areas: ["vocabulary"],
  preferred_session_length: 20, target_grade: "M", weekly_goal_minutes: 140,
};
const PAYLOAD = {
  totalSessions: 12, modeStats: { vocab: 4, grammar: 3, reading: 3, writing: 2 },
  recent: [], streak: 3, weekSessions: 4, prevWeekSessions: 2, estLevel: "B",
  pro: false, aiUsage: null, chartData: [],
};

for (const w of [1180, 1280, 1440, 1920]) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: "block" });
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

  // Force the longest word-of-day to test worst case.
  await page.evaluate(() => {
    const head = document.querySelector(".word-of-day__head");
    if (head) {
      head.querySelector(".word-of-day__es").textContent = "ponerse de acuerdo con todos";
    }
    const fi = document.querySelector(".word-of-day__fi");
    if (fi) fi.textContent = "päästä yksimielisyyteen kaikkien kanssa";
    const ex = document.querySelector(".word-of-day__ex-es");
    if (ex) ex.textContent = "Acabamos por ponernos de acuerdo con todos los miembros del comité internacional sobre la nueva política.";
  });
  await page.waitForTimeout(50);

  const result = await page.evaluate(() => {
    const rail = document.querySelector(".app-rail");
    if (!rail) return { error: "no rail" };
    const railRect = rail.getBoundingClientRect();
    const overflows = [];
    rail.querySelectorAll("*").forEach((el) => {
      // True horizontal overflow inside the element itself
      const sw = el.scrollWidth;
      const cw = el.clientWidth;
      const r = el.getBoundingClientRect();
      const hangRight = r.right - railRect.right;
      if (sw > cw + 1) {
        overflows.push({
          tag: el.tagName,
          cls: typeof el.className === "string" ? el.className.slice(0, 60) : "",
          scrollWidth: sw, clientWidth: cw, diff: sw - cw,
          text: (el.textContent || "").trim().slice(0, 50),
        });
      } else if (hangRight > 1) {
        overflows.push({
          tag: el.tagName,
          cls: typeof el.className === "string" ? el.className.slice(0, 60) : "",
          hangRight: Math.round(hangRight),
          width: Math.round(r.width),
          text: (el.textContent || "").trim().slice(0, 50),
        });
      }
    });
    return { railRectRight: railRect.right, overflowCount: overflows.length, top: overflows.slice(0, 5) };
  });
  console.log(`viewport ${w}:`, JSON.stringify(result, null, 2));
  await ctx.close();
  await browser.close();
}
