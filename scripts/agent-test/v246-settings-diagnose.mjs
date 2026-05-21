// v246 — Diagnose Bug 1: Asetukset requires scroll on 1366×768.
// Dumps computed CSS for every wrapper in the chain, and reports
// where the overflow originates.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const PROFILE = {
  onboarding_completed: true,
  starting_level: "B",
  current_grade: "B",
  exam_date: "2027-03-15",
  spanish_courses_completed: 4,
  spanish_grade_average: 8,
  study_background: "lukio",
  weak_areas: ["subjunctive", "ser_estar"],
  strong_areas: ["vocabulary"],
  preferred_session_length: 20,
  target_grade: "M",
  weekly_goal_minutes: 140,
  target_language: "es",
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  serviceWorkers: "block",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("pageerror:", e.message));

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "testpro123@gmail.com");
  localStorage.setItem("puheo_gate_ok_v1", "1");
});

const ok = (body) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
await page.route("**/api/profile", ok({ profile: PROFILE }));
await page.route("**/api/auth/me", ok({ ok: true, pro: true, email: "testpro123@gmail.com" }));
await page.route("**/api/dashboard", ok({ totalSessions: 8, modeStats: {}, recent: [], streak: 1, weekSessions: 2, estLevel: "B", pro: true }));
await page.route("**/api/learning-path", ok({ path: [] }));
await page.route("**/api/sr/**", ok({}));
await page.route("**/api/placement/**", ok({ needed: false }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(900);

await page.evaluate(async () => {
  const mod = await import("/js/screens/settings.js");
  await mod.showSettings();
});
await page.waitForTimeout(700);

const dump = await page.evaluate(() => {
  const props = ["display", "position", "height", "minHeight", "maxHeight",
    "paddingTop", "paddingBottom", "marginTop", "marginBottom",
    "overflow", "overflowY", "boxSizing", "alignItems", "justifyContent"];
  const dumpEl = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const o = { tag: el.tagName, id: el.id, cls: el.className,
                rect: { top: r.top, height: r.height, bottom: r.bottom },
                scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
    props.forEach((p) => { o[p] = cs[p]; });
    return o;
  };
  const screen = document.getElementById("screen-settings");
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    documentScrollHeight: document.documentElement.scrollHeight,
    bodyScrollHeight: document.body.scrollHeight,
    chain: {
      html: dumpEl(document.documentElement),
      body: dumpEl(document.body),
      shell: dumpEl(document.querySelector(".app-shell")),
      main: dumpEl(document.querySelector(".app-main")),
      mainInner: dumpEl(document.querySelector(".app-main-inner")),
      screen: dumpEl(screen),
      inner: dumpEl(screen?.querySelector(".settings-inner")),
    },
  };
});

console.log(JSON.stringify(dump, null, 2));

await page.screenshot({ path: "scripts/agent-test/screenshots/v246-before.png", fullPage: false });

await ctx.close();
await browser.close();
