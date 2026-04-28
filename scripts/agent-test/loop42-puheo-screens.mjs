// Loop 42 Section A(d) — capture Puheo screens for the landing rebuild's
// browser-frame mockups + product-pillar thumbnails.
//
// Approach: serviceWorkers blocked + every /api/* route mocked, so screenshots
// are reproducible across loops without needing real auth or real DB state.
//
// Outputs: references/puheo-screens/<screen>-<width>.png
// Screens: dashboard, profile, mode-vocab, writing
// Widths : 1440 (desktop hero / browser frame) and 375 (mobile)

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("references/puheo-screens");
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { label: "1440", width: 1440, height: 900 },
  { label: "375",  width: 375,  height: 812 },
];

// Mock data — chosen to make screenshots look like a serious returning user
// (mid-progress streak, mixed mode counts, real-looking grade arc).
const PROFILE = {
  onboarding_completed: true,
  starting_level: "B",
  current_grade: "C",
  exam_date: "2026-09-28",
  spanish_courses_completed: 5,
  spanish_grade_average: 8,
  study_background: "lukio",
  weak_areas: ["subjunctive", "ser_estar"],
  strong_areas: ["vocabulary"],
  preferred_session_length: 15,
  target_grade: "M",
  weekly_goal_minutes: 105,
  display_name: "Ronja",
};

// 14-day grade arc — slowly climbing C → M.
const CHART = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-04-${String(15 + i).padStart(2, "0")}`,
  grade: ["C","C","B","B","C","B","B","M","B","M","M","B","M","M"][i],
  pct: 50 + Math.round(i * 1.7),
}));

const DASHBOARD_PAYLOAD = {
  totalSessions: 47,
  modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
  recent: [
    { mode: "writing",  date: "2026-04-28", score: 0.78, label: "Lemmikin esittely" },
    { mode: "grammar",  date: "2026-04-27", score: 0.85, label: "Subjunktiivi (esp. ojalá)" },
    { mode: "vocab",    date: "2026-04-26", score: 0.92, label: "Matkustaminen B1" },
    { mode: "reading",  date: "2026-04-25", score: 0.71, label: "Tiedote loma-asunnosta" },
    { mode: "vocab",    date: "2026-04-24", score: 0.88, label: "Ruoka & ravintola" },
  ],
  streak: 12,
  weekSessions: 5,
  prevWeekSessions: 3,
  estLevel: "C",
  gradeEstimate: "B",
  suggestedLevel: "B",
  modeDaysAgo: { vocab: 2, grammar: 1, reading: 3, writing: 0 },
  pro: true,
  aiUsage: { used: 14, limit: 50 },
  chartData: CHART,
};

const LEARNING_PATH = {
  path: [
    { key: "ser_estar",     status: "mastered",    bestPct: 0.92, label: "Ser vs estar",        short: "S/E" },
    { key: "preteriti",     status: "in_progress", bestPct: 0.62, label: "Preteriti vs imp.",   short: "Pret" },
    { key: "subj",          status: "in_progress", bestPct: 0.41, label: "Subjunktiivi",        short: "Subj" },
    { key: "por_para",      status: "available",   bestPct: 0.10, label: "Por vs para",         short: "P/P" },
    { key: "condicional",   status: "locked",      bestPct: 0.00, label: "Condicional",         short: "Cond" },
    { key: "imperativo",    status: "locked",      bestPct: 0.00, label: "Imperativo",          short: "Imp" },
  ],
};

async function mockRoutes(page, { pro = true } = {}) {
  const json = (body) => (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(body),
  });
  // CRITICAL: Playwright matches routes in REVERSE registration order — the
  // most-recently-added handler is checked first. So register the broadest
  // catch-alls FIRST, then specific routes LAST so the specific ones win.
  await page.route("**/api/**",                     json({}));
  await page.route("**/api/profile",                json({ profile: PROFILE }));
  await page.route("**/api/auth/me",                json({ ok: true, pro, email: "ronja@example.fi" }));
  await page.route("**/api/dashboard",              json(DASHBOARD_PAYLOAD));
  await page.route("**/api/learning-path",          json(LEARNING_PATH));
  await page.route("**/api/seed-counts",            json({ vocab: 500, grammar: 480, reading: 60, writing: 30 }));
  await page.route("**/api/placement/status",       json({ completed: true, needed: false }));
  await page.route("**/api/placement/needed",       json({ needed: false }));
  await page.route("**/api/config/public",          json({ posthog: null, sentry: null }));
  await page.route("**/api/adaptive-state",         json({ state: null }));
  await page.route("**/api/adaptive/status*",       json({ status: null }));
  await page.route("**/api/exam/history",           json({ history: [] }));
  await page.route("**/api/weak-topics*",           json({ topics: [] }));
  await page.route("**/api/sr/count*",              json({ count: 14 }));
  await page.route("**/api/sr/forecast*",           json({ forecast: [] }));
  await page.route("**/api/push/vapid-key",         json({ key: null }));
}

async function shoot({ navHash, label, vp }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    serviceWorkers: "block",
    deviceScaleFactor: 2, // crisp screenshots
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[${label}@${vp.label}] PAGEERROR:`, e.message));

  await page.addInitScript(() => {
    localStorage.setItem("puheo_token", "mock-token");
    localStorage.setItem("puheo_email", "ronja@example.fi");
  });

  await mockRoutes(page);
  await page.goto(`${BASE}/app.html${navHash}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800); // let in-flight animations (blur-fade, ring) settle

  const out = path.join(OUT, `${label}-${vp.label}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`OK  ${label}@${vp.label}  ->  ${out}`);

  await ctx.close();
  await browser.close();
}

const SHOTS = [
  { navHash: "#/koti",       label: "dashboard"  },
  { navHash: "#/oma-sivu",   label: "profile"    },
  { navHash: "#/sanasto",    label: "mode-vocab" },
  { navHash: "#/kirjoitus",  label: "writing"    },
];

for (const shot of SHOTS) {
  for (const vp of VIEWPORTS) {
    try {
      await shoot({ ...shot, vp });
    } catch (e) {
      console.warn(`FAIL ${shot.label}@${vp.label} — ${e.message}`);
    }
  }
}

console.log("done.");
