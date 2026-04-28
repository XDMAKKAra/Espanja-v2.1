// Pinpoint what's blocking pointer events on settings-row-edit buttons.
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
await page.route("**/api/profile", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: PROFILE }) }));
await page.route("**/api/auth/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, pro: false }) }));
await page.route("**/api/dashboard", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ totalSessions: 0, modeStats: {}, recent: [], streak: 0, weekSessions: 0, estLevel: "B", pro: false, chartData: [] }) }));
await page.route("**/api/learning-path", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }));
await page.route("**/api/sr/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/placement/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.click("#nav-settings");
await page.waitForTimeout(800);

// What is the SINGLE topmost element at the centre of the first edit button?
const result = await page.evaluate(() => {
  const btn = document.querySelector('.settings-row-edit[data-field="exam_date"]');
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width/2;
  const cy = r.top + r.height/2;
  const top = document.elementFromPoint(cx, cy);
  const stack = document.elementsFromPoint(cx, cy).slice(0, 6);

  // Walk up MAIN's children that have rects covering this point
  const main = document.getElementById("app-main");
  const overlapping = Array.from(main.children).filter((c) => {
    const cr = c.getBoundingClientRect();
    return cr.left <= cx && cr.right >= cx && cr.top <= cy && cr.bottom >= cy;
  }).map((c) => ({
    tag: c.tagName, id: c.id, cls: c.className,
    pos: getComputedStyle(c).position, z: getComputedStyle(c).zIndex,
    rect: c.getBoundingClientRect().toJSON(),
  }));

  // Check if app-main has overflow that clips
  const mainStyle = getComputedStyle(main);

  return {
    point: { x: cx, y: cy },
    btnRect: r.toJSON(),
    btnTop: top ? { tag: top.tagName, id: top.id, cls: top.className } : null,
    btnIsTop: top === btn,
    btnClosestStackingContext: (() => {
      let el = btn.parentElement;
      while (el) {
        const cs = getComputedStyle(el);
        if (cs.zIndex !== "auto" || cs.transform !== "none" || cs.filter !== "none" || cs.opacity !== "1" || cs.willChange !== "auto" || cs.isolation !== "auto") {
          return { tag: el.tagName, id: el.id, cls: el.className, z: cs.zIndex, pos: cs.position, transform: cs.transform, filter: cs.filter, opacity: cs.opacity, willChange: cs.willChange, isolation: cs.isolation };
        }
        el = el.parentElement;
      }
      return null;
    })(),
    stack: stack.map((e) => ({ tag: e.tagName, id: e.id, cls: e.className, z: getComputedStyle(e).zIndex, pos: getComputedStyle(e).position })),
    mainOverflow: mainStyle.overflow,
    mainPaddingTop: mainStyle.paddingTop,
    mainOverlappingChildren: overlapping,
  };
});

console.log(JSON.stringify(result, null, 2));

await ctx.close();
await browser.close();
