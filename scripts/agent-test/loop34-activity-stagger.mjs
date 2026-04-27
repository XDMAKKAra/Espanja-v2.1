// Loop 34 — verify the staggered reveal on the profile activity timeline.
// Captures three frames: pre-render (rows hidden), mid-stagger, settled.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const now = Date.now();
const RECENT = Array.from({ length: 8 }, (_, i) => ({
  mode: ["vocab","grammar","reading","writing"][i % 4],
  level: "C", scoreCorrect: 8 + i, scoreTotal: 12,
  ytlGrade: i === 0 ? "M" : (i === 4 ? "E" : null),
  createdAt: new Date(now - (i + 1) * 6 * 3_600_000).toISOString().slice(0, 19),
}));

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block", reducedMotion: "no-preference" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
  window._userProfile = { onboarding_completed: true, starting_level: "B" };
});

await page.route("**/api/dashboard", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  totalSessions: 47, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
  recent: RECENT, streak: 5, weekSessions: 4, prevWeekSessions: 3, estLevel: "C",
  gradeEstimate: { tier: "early", grade: "C", confidence: 0.4, coverage: {}, total: 47 },
  pro: false, aiUsage: null, chartData: [],
})}));
await page.route("**/api/profile", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B" } }) }));
await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
await page.route("**/api/sr/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/learning-path", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }));
await page.route("**/api/placement/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(900);

// Drive the profile screen via the real loadProfile path.
await page.evaluate(async () => {
  const mod = await import("/js/screens/profile.js");
  await mod.loadProfile();
});

// Mid-stagger: at ~200ms in, the first ~4 of 8 rows should be at full
// opacity while the rest are still transitioning.
await page.waitForTimeout(220);
const probe = await page.$$eval(".profile-activity-row", (rows) => rows.map((r) => ({
  delay: r.style.getPropertyValue("--enter-delay"),
  opacity: parseFloat(getComputedStyle(r).opacity).toFixed(2),
  transform: getComputedStyle(r).transform,
})));
console.log("mid-stagger states:", probe);
await page.screenshot({ path: path.join(OUT, "loop-34-activity-mid.png"), clip: { x: 480, y: 380, width: 720, height: 460 } });

// Settled: full transition complete.
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(OUT, "loop-34-activity-settled.png"), clip: { x: 480, y: 380, width: 720, height: 460 } });

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — activity stagger screenshots saved");
