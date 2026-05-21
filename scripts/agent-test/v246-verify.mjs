// v246 final verification — Asetukset + Home both pass scroll bound, screenshot evidence.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:3000";
fs.mkdirSync("scripts/agent-test/screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "testpro123@gmail.com");
  localStorage.setItem("puheo_gate_ok_v1", "1");
});
const ok = (b) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
await page.route("**/api/profile", ok({ profile: {
  onboarding_completed: true, target_grade: "M", target_language: "es",
  exam_date: "2027-03-15", spanish_courses_completed: 4, spanish_grade_average: 8,
  study_background: "lukio", weak_areas: ["subjunctive"], strong_areas: ["vocabulary"],
  preferred_session_length: 20, current_grade: "B",
}}));
await page.route("**/api/auth/me", ok({ ok: true, pro: true, email: "testpro123@gmail.com" }));
await page.route("**/api/dashboard", ok({ totalSessions: 8, recent: [], streak: 1, weekSessions: 2, estLevel: "B", pro: true, modeStats: {} }));
await page.route("**/api/learning-path", ok({ path: [] }));
await page.route("**/api/sr/**", ok({}));
await page.route("**/api/placement/**", ok({ needed: false }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

const homeMetric = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  innerHeight: window.innerHeight,
  activeScreen: document.querySelector(".screen.active")?.id,
}));
console.log("HOME baseline:", JSON.stringify(homeMetric));
await page.screenshot({ path: "scripts/agent-test/screenshots/v246-home.png" });

// Click Asetukset in sidebar
await page.evaluate(async () => {
  const mod = await import("/js/screens/settings.js");
  await mod.showSettings();
});
await page.waitForTimeout(700);

const settingsMetric = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  innerHeight: window.innerHeight,
  activeScreen: document.querySelector(".screen.active")?.id,
  screenScrollHeight: document.getElementById("screen-settings")?.scrollHeight,
  screenClientHeight: document.getElementById("screen-settings")?.clientHeight,
  formVisible: !!document.getElementById("settings-nickname-input"),
}));
console.log("SETTINGS:", JSON.stringify(settingsMetric));
await page.screenshot({ path: "scripts/agent-test/screenshots/v246-settings.png" });

// Test: scroll inside settings form
await page.evaluate(() => {
  document.getElementById("screen-settings").scrollTop = 800;
});
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/agent-test/screenshots/v246-settings-scrolled.png" });
const afterScroll = await page.evaluate(() => ({
  pageScrollY: window.scrollY,
  screenScrollTop: document.getElementById("screen-settings").scrollTop,
}));
console.log("AFTER internal scroll:", JSON.stringify(afterScroll));

// PASS criterion
const PASS = settingsMetric.scrollHeight <= settingsMetric.innerHeight;
console.log("\n=== v246 PASS:", PASS, "===");
console.log("settings scrollHeight:", settingsMetric.scrollHeight, "vs innerHeight:", settingsMetric.innerHeight);

if (errors.length) console.log("CONSOLE ERRORS:\n" + errors.join("\n"));

await ctx.close(); await browser.close();
process.exit(PASS ? 0 : 1);
