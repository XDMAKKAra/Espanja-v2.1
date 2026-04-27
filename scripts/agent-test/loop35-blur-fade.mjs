// Loop 35 — verify blur-fade arrival on the dashboard hero. Capture two
// frames (mid + settled) and read computed styles to confirm the children
// transition from blurred/translated/transparent to identity.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PAYLOAD = {
  totalSessions: 47, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
  recent: [], streak: 5, weekSessions: 4, prevWeekSessions: 3, estLevel: "C",
  gradeEstimate: { tier: "early", grade: "C", confidence: 0.4, coverage: {}, total: 47 },
  pro: false, aiUsage: null, chartData: [],
};

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

await page.route("**/api/dashboard", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PAYLOAD) }));
await page.route("**/api/profile", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B" } }) }));
await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
await page.route("**/api/sr/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/learning-path", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }));
await page.route("**/api/placement/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(900);

await page.evaluate(async () => {
  const mod = await import("/js/screens/dashboard.js");
  await mod.loadDashboard();
});

// Snapshot ~150ms in (eyebrow at delay 0 ~30%, display at delay 80 ~13%, sub still pre-start)
await page.waitForTimeout(140);
const states = await page.$$eval("#screen-dashboard .dash-greeting > *", (els) => els.map((e) => ({
  tag: e.tagName.toLowerCase(),
  delay: getComputedStyle(e).transitionDelay,
  filter: getComputedStyle(e).filter,
  opacity: getComputedStyle(e).opacity,
  transform: getComputedStyle(e).transform,
})));
console.log("blur-fade states:", states);
await page.screenshot({ path: path.join(OUT, "loop-35-hero-mid.png"), clip: { x: 240, y: 0, width: 600, height: 220 } });

await page.waitForTimeout(900);
await page.screenshot({ path: path.join(OUT, "loop-35-hero-settled.png"), clip: { x: 240, y: 0, width: 600, height: 220 } });

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — blur-fade screenshots saved");
