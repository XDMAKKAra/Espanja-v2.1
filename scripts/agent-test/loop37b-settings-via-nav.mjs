// Loop 37b — drive settings via the actual sidebar click (not direct module
// import). Captures whether real-user navigation also opens the modal.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PROFILE = {
  onboarding_completed: true, starting_level: "B", current_grade: "B",
  exam_date: "2027-03-15", spanish_courses_completed: 4, spanish_grade_average: 8,
  study_background: "lukio", weak_areas: ["subjunctive"], strong_areas: ["vocabulary"],
  preferred_session_length: 20, target_grade: "M", weekly_goal_minutes: 140,
};

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  serviceWorkers: "block",
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
page.on("console", (m) => {
  const t = m.type();
  if (t === "error" || t === "warning") errors.push(`${t}: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
});

await page.route("**/api/profile", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: PROFILE }) }),
);
await page.route("**/api/auth/me", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, pro: false }) }),
);
await page.route("**/api/dashboard", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ totalSessions: 8, modeStats: {}, recent: [], streak: 1, weekSessions: 2, estLevel: "B", pro: false, chartData: [] }) }),
);
await page.route("**/api/learning-path", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }),
);
await page.route("**/api/sr/**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
);
await page.route("**/api/placement/**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }),
);

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1200);

// Probe boot state
const bootProbe = await page.evaluate(() => ({
  navSettingsExists: !!document.getElementById("nav-settings"),
  navSettingsHidden: document.getElementById("nav-settings")?.hidden,
  navSettingsDisplay: document.getElementById("nav-settings") ? getComputedStyle(document.getElementById("nav-settings")).display : "missing",
  activeScreen: Array.from(document.querySelectorAll(".screen")).find((s) => !s.classList.contains("hidden"))?.id,
}));
console.log("BOOT:", JSON.stringify(bootProbe, null, 2));

// Click the real sidebar button.
const navBtn = await page.$("#nav-settings");
if (!navBtn) {
  console.log("FATAL: #nav-settings not found");
  process.exit(1);
}
await navBtn.click();
await page.waitForTimeout(800);

const afterNav = await page.evaluate(() => ({
  activeScreen: Array.from(document.querySelectorAll(".screen")).find((s) => !s.classList.contains("hidden"))?.id,
  rowsCount: document.querySelectorAll(".settings-row-edit[data-field]").length,
  rowsBusy: document.getElementById("settings-profile-rows")?.getAttribute("aria-busy"),
  rowsTextPreview: document.getElementById("settings-profile-rows")?.textContent?.slice(0, 80),
}));
console.log("AFTER NAV CLICK:", JSON.stringify(afterNav, null, 2));

// Now click an edit button via the real DOM
const editBtn = await page.$('.settings-row-edit[data-field="exam_date"]');
if (!editBtn) {
  console.log("FATAL: no edit button");
} else {
  await editBtn.click();
  await page.waitForTimeout(300);
  const afterEdit = await page.evaluate(() => ({
    overlayHidden: document.getElementById("settings-modal-overlay")?.classList.contains("hidden"),
    overlayDisplay: getComputedStyle(document.getElementById("settings-modal-overlay")).display,
    title: document.getElementById("settings-modal-title")?.textContent,
    bodyHasOpts: document.querySelectorAll("#settings-modal-body .settings-opt").length,
  }));
  console.log("AFTER EDIT CLICK:", JSON.stringify(afterEdit, null, 2));
  await page.screenshot({ path: path.join(OUT, "loop-37b-modal-open.png"), fullPage: false });
}

await ctx.close();
await browser.close();

if (errors.length) console.error("CONSOLE:\n" + errors.join("\n"));
else console.log("(no console errors)");
