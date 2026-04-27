// Loop 29 — verify YO-valmius readiness ring renders + animates.
// Mocks /api/learning-path so computeReadinessMap returns a non-zero
// readinessPct, then captures a settled-frame screenshot of the ring.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

function dashPayload({ streak = 5, totalSessions = 47, weekSessions = 4 } = {}) {
  const now = Date.now();
  return {
    totalSessions, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
    recent: [{ mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(now - 60_000).toISOString().slice(0, 19) }],
    streak, weekSessions, prevWeekSessions: 3,
    estLevel: "C", gradeEstimate: { tier: "early", grade: "C", confidence: 0.4, coverage: {}, total: totalSessions },
    suggestedLevel: "B", modeDaysAgo: {}, pro: false, aiUsage: null,
    chartData: Array.from({ length: streak }, (_, i) => ({
      createdAt: new Date(now - i * 86_400_000).toISOString().slice(0, 19),
      mode: "vocab", scoreCorrect: 9, scoreTotal: 12, level: "B",
    })),
  };
}

// A learning-path payload — shape per computeReadinessMap:
// expects { key, label, short, status: "mastered"|"in_progress"|"available"|"locked", bestPct }.
const LEARNING_PATH = {
  path: [
    { key: "ser_vs_estar",  label: "Ser vs Estar",  short: "ser/estar", status: "mastered",    bestPct: 0.92 },
    { key: "presentti",     label: "Presentti",     short: "presens",   status: "mastered",    bestPct: 0.95 },
    { key: "imperfekti",    label: "Imperfekti",    short: "imperf.",   status: "in_progress", bestPct: 0.65 },
    { key: "preteritti",    label: "Preteriti",     short: "preter.",   status: "in_progress", bestPct: 0.55 },
    { key: "subjunktiivi",  label: "Subjunktiivi",  short: "subj.",     status: "in_progress", bestPct: 0.20 },
    { key: "futuuri",       label: "Futuuri",       short: "fut.",      status: "available",   bestPct: 0.00 },
    { key: "ruoka",         label: "Ruoka",         short: "ruoka",     status: "mastered",    bestPct: 0.85 },
    { key: "matkustaminen", label: "Matkustaminen", short: "matk.",     status: "in_progress", bestPct: 0.50 },
    { key: "media",         label: "Media",         short: "media",     status: "in_progress", bestPct: 0.62 },
    { key: "kulttuuri",     label: "Kulttuuri",     short: "kult.",     status: "in_progress", bestPct: 0.45 },
  ],
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

await page.route("**/api/dashboard", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashPayload({ streak: 5 })) }));
await page.route("**/api/learning-path", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LEARNING_PATH) }));
await page.route("**/api/profile", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B", exam_date: "2026-09-28" } }) }));
await page.route("**/api/profile/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "ronja.virtanen@gmail.com" }) }));
await page.route("**/api/sr/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0, due: [] }) }));
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

// Mid-anim snapshot (ring sweeping + countUp running)
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, "loop-29-readiness-ring-mid.png"), clip: { x: 1080, y: 0, width: 360, height: 400 } });

// Settled snapshot (full transition complete)
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, "loop-29-readiness-ring-settled.png"), clip: { x: 1080, y: 0, width: 360, height: 400 } });

// Full dashboard at settled
await page.screenshot({ path: path.join(OUT, "loop-29-dashboard-full.png"), fullPage: false });

// Sanity readback: ring should have a non-default stroke-dashoffset.
const ringState = await page.evaluate(() => {
  const r = document.getElementById("dash-yo-readiness-ring");
  if (!r) return { exists: false };
  return { exists: true, dashoffset: r.style.strokeDashoffset, num: document.getElementById("dash-yo-readiness")?.textContent };
});
console.log("ringState:", ringState);

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — readiness ring screenshots saved");
