// Loop 30 — verify the smooth Catmull-Rom + token-only chart polish.
// Mocks /api/dashboard with a 14-point chartData series of varying grades
// so renderProgressChart actually has a curve to draw.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const now = Date.now();
const GRADES = ["B", "C", "B", "C", "M", "C", "M", "M", "E", "M", "E", "M", "E", "L"];
const chartData = GRADES.map((g, i) => ({
  createdAt: new Date(now - (GRADES.length - 1 - i) * 86_400_000).toISOString().slice(0, 19),
  mode: "writing", scoreCorrect: 28, scoreTotal: 33, level: "C", ytlGrade: g, pct: null,
}));

const PAYLOAD = {
  totalSessions: 47,
  modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
  recent: chartData.slice(-3),
  streak: 5, weekSessions: 4, prevWeekSessions: 3,
  estLevel: "C", gradeEstimate: { tier: "trending", grade: "M", confidence: 0.7, coverage: { writing: 14 }, total: 47 },
  suggestedLevel: "C", modeDaysAgo: {}, pro: false, aiUsage: null,
  chartData,
};

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(`console.error: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
  localStorage.setItem("puheo_streak_milestone", "30");
  window._userProfile = { onboarding_completed: true, starting_level: "B" };
});

await page.route("**/api/dashboard", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PAYLOAD) }));
await page.route("**/api/profile", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28" } }) }));
await page.route("**/api/profile/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "ronja.virtanen@gmail.com" }) }));
await page.route("**/api/sr/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0, due: [] }) }));
await page.route("**/api/learning-path", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }));
await page.route("**/api/progression/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/adaptive/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ levelProgress: 0 }) }));
await page.route("**/api/topics/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
await page.route("**/api/placement/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));
await page.route("**/api/config", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1500);
await page.evaluate(async () => {
  const mod = await import("/js/screens/dashboard.js");
  await mod.loadDashboard();
});
await page.waitForTimeout(2000);

// Locate the chart and clip a screenshot to just it for clarity.
const box = await page.evaluate(() => {
  const el = document.getElementById("dash-chart");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.floor(r.x) - 16, y: Math.floor(r.y) - 16, width: Math.ceil(r.width) + 32, height: Math.ceil(r.height) + 32 };
});
if (box) {
  await page.screenshot({ path: path.join(OUT, "loop-30-chart-clip.png"), clip: box });
}
await page.screenshot({ path: path.join(OUT, "loop-30-dashboard-full.png"), fullPage: false });

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — chart polish screenshots saved");
