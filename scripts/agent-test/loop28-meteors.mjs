// Loop 28 — verify meteors render behind the dashboard hero when streak >= 7,
// and not at all when streak < 7. Same harness as loop27 (mocks /api/dashboard
// via page.route + serviceWorkers: "block").
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
    chartData: Array.from({ length: Math.min(streak, 30) }, (_, i) => ({
      createdAt: new Date(now - i * 86_400_000).toISOString().slice(0, 19),
      mode: "vocab", scoreCorrect: 9, scoreTotal: 12, level: "B",
    })),
  };
}

const SCENARIOS = [
  { slug: "meteors-streak2-off",  payload: mockPayload({ streak: 2, totalSessions: 6 }),    expectMeteors: false },
  { slug: "meteors-streak7-on",   payload: mockPayload({ streak: 7, totalSessions: 47 }),   expectMeteors: true  },
  { slug: "meteors-streak30-rich", payload: mockPayload({ streak: 30, totalSessions: 142, weekSessions: 7 }), expectMeteors: true },
];

const errors = [];
const browser = await chromium.launch();
try {
  for (const s of SCENARIOS) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[${s.slug}] console.error: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`[${s.slug}] pageerror: ${e.message}`));

    await page.addInitScript(() => {
      localStorage.setItem("puheo_token", "mock");
      localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
      // Pre-mark all milestones seen so confetti doesn't dominate the shot.
      localStorage.setItem("puheo_streak_milestone", "30");
      window._userProfile = { onboarding_completed: true, starting_level: "B" };
    });

    await page.route("**/api/dashboard", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.payload) });
    });
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

    // Let countUp finish, then freeze every meteor at a deterministic frame
    // inside the visible phase of the keyframe so the screenshot captures them
    // mid-arc instead of relying on whatever frame Playwright lands on.
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const el = document.getElementById("dash-meteors");
      if (!el) return;
      el.querySelectorAll(".meteor").forEach((m, i) => {
        // Distribute across the visible phase (10..70% of keyframe).
        const t = 0.20 + (i / 24) * 0.45;
        const dur = 6;
        m.style.animationDelay = `${-(t * dur)}s`;
        m.style.animationDuration = `${dur}s`;
        m.style.animationPlayState = "paused";
      });
    });
    await page.waitForTimeout(150);

    // Sanity check: meteors element state matches expectation.
    const meteorState = await page.evaluate(() => {
      const el = document.getElementById("dash-meteors");
      if (!el) return { exists: false };
      return { exists: true, hidden: el.hidden, mounted: el.dataset.meteorsMounted === "1", count: el.querySelectorAll(".meteor").length };
    });
    if (s.expectMeteors && !meteorState.mounted) {
      errors.push(`[${s.slug}] expected meteors mounted, got: ${JSON.stringify(meteorState)}`);
    }
    if (!s.expectMeteors && meteorState.mounted) {
      errors.push(`[${s.slug}] expected NO meteors, but mounted: ${JSON.stringify(meteorState)}`);
    }

    await page.screenshot({ path: path.join(OUT, `loop-28-${s.slug}.png`), fullPage: false });
    await ctx.close();
  }
} finally {
  await browser.close();
}
const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) {
  console.error("ERRORS:\n" + real.join("\n"));
  process.exit(1);
} else {
  console.log("OK — meteors screenshots saved");
}
