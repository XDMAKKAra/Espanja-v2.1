// Loop 36 — verify blur-fade extends to the profile hero (avatar + name +
// handle + badges) using the same pattern as L35 dashboard.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PAYLOAD = {
  totalSessions: 47, modeStats: { vocab: 18, grammar: 12, reading: 9, writing: 8 },
  recent: [{ mode: "writing", level: "C", scoreCorrect: 27, scoreTotal: 33, ytlGrade: "M", createdAt: new Date(Date.now() - 60_000).toISOString().slice(0, 19) }],
  streak: 11, weekSessions: 6, prevWeekSessions: 4, estLevel: "C",
  pro: true, aiUsage: null, chartData: [],
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
  const mod = await import("/js/screens/profile.js");
  await mod.loadProfile();
});

await page.waitForTimeout(160);
const states = await page.$$eval("#screen-profile .profile-hero .profile-avatar, #screen-profile .profile-hero .profile-name, #screen-profile .profile-hero .profile-handle, #screen-profile .profile-hero .profile-badges", (els) => els.map((e) => ({
  cls: e.className,
  delay: getComputedStyle(e).transitionDelay,
  filter: getComputedStyle(e).filter,
  opacity: parseFloat(getComputedStyle(e).opacity).toFixed(3),
})));
console.log("profile blur-fade states:", states);
await page.screenshot({ path: path.join(OUT, "loop-36-profile-mid.png"), clip: { x: 240, y: 0, width: 700, height: 280 } });

await page.waitForTimeout(900);
await page.screenshot({ path: path.join(OUT, "loop-36-profile-settled.png"), clip: { x: 240, y: 0, width: 700, height: 280 } });

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — profile blur-fade screenshots saved");
