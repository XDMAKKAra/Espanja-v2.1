// Loop 27 — verify count-up animations and milestone confetti on dashboard.
// Mocks the /api/dashboard payload via route fulfillment so the real client
// rendering path runs end-to-end (countUp, celebrateStreakMilestone, etc.).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

function mockPayload({ streak, totalSessions, weekSessions = 4 }) {
  const now = Date.now();
  return {
    totalSessions, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
    recent: [{ mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(now - 60_000).toISOString().slice(0, 19) }],
    streak, weekSessions, prevWeekSessions: Math.max(0, weekSessions - 1),
    estLevel: "C", gradeEstimate: { tier: "early", grade: "C", confidence: 0.4, coverage: {}, total: totalSessions },
    suggestedLevel: "B", modeDaysAgo: {}, pro: false, aiUsage: null,
    chartData: Array.from({ length: streak }, (_, i) => ({
      createdAt: new Date(now - i * 86_400_000).toISOString().slice(0, 19),
      mode: "vocab", scoreCorrect: 9, scoreTotal: 12, level: "B",
    })),
  };
}

const SCENARIOS = [
  { slug: "dash-counters-streak7", viewport: { width: 1440, height: 900 }, payload: mockPayload({ streak: 7, totalSessions: 47 }), seenMilestone: 0 },
  { slug: "dash-counters-streak3", viewport: { width: 1440, height: 900 }, payload: mockPayload({ streak: 3, totalSessions: 12 }), seenMilestone: 0 },
  { slug: "dash-counters-mid",     viewport: { width: 1440, height: 900 }, payload: mockPayload({ streak: 11, totalSessions: 64 }), seenMilestone: 7 }, // 11 still in 7-band, no fresh celebration
  { slug: "dash-counters-mobile",  viewport: { width: 375,  height: 812 }, payload: mockPayload({ streak: 7, totalSessions: 47 }), seenMilestone: 0 },
];

const errors = [];
const browser = await chromium.launch();
try {
  for (const s of SCENARIOS) {
    const ctx = await browser.newContext({ viewport: s.viewport, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[${s.slug}] console.error: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`[${s.slug}] pageerror: ${e.message}`));

    await page.addInitScript(({ seenMilestone }) => {
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
      localStorage.setItem("puheo_streak_milestone", String(seenMilestone));
      // Seed _userProfile so the CTA logic doesn't push us into onboarding
      window._userProfile = { onboarding_completed: true, starting_level: "B" };
    }, { seenMilestone: s.seenMilestone });

    // Stub the dashboard endpoint with our mock payload.
    await page.route("**/api/dashboard", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(s.payload),
      });
    });

    // Stub all auth-relevant API calls so the boot chain proceeds straight
    // to the dashboard renderer.
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
    // Wait for boot chain to settle, then ensure the dashboard renders.
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      // Hide any other screen and force-show dashboard, then re-run loadDashboard
      // so countUp / milestone celebration fire on a deterministic frame.
      const mod = await import("/js/screens/dashboard.js");
      await mod.loadDashboard();
    });

    // Snapshot mid-anim (countUp duration ~1100ms)
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `loop-27-${s.slug}-mid.png`), fullPage: false });

    // Snapshot final state (after countUp settles + confetti has launched)
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `loop-27-${s.slug}.png`), fullPage: false });

    await ctx.close();
  }
} finally {
  await browser.close();
}
const real = errors.filter((e) => !/401|404|net::ERR/.test(e));
if (real.length) {
  console.error("ERRORS:\n" + real.join("\n"));
  process.exit(1);
} else {
  console.log("OK — dashboard counter screenshots saved");
}
