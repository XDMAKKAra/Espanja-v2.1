// Loop 37 — reproduce the dead Muokkaa buttons on #screen-settings.
// Goal: find out *why* the click does nothing — handler not wired, modal not
// opening, modal opening but invisible, etc. Outputs raw signals to stdout.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PROFILE = {
  onboarding_completed: true,
  starting_level: "B",
  current_grade: "B",
  exam_date: "2027-03-15",
  spanish_courses_completed: 4,
  spanish_grade_average: 8,
  study_background: "lukio",
  weak_areas: ["subjunctive", "ser_estar"],
  strong_areas: ["vocabulary"],
  preferred_session_length: 20,
  target_grade: "M",
  weekly_goal_minutes: 140,
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
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ totalSessions: 8, modeStats: {}, recent: [], streak: 1, weekSessions: 2, estLevel: "B", pro: false }) }),
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
await page.waitForTimeout(900);

// Manually invoke showSettings — this matches what nav-settings does.
await page.evaluate(async () => {
  const mod = await import("/js/screens/settings.js");
  await mod.showSettings();
});
await page.waitForTimeout(800);

// Probe: is the screen visible? Are there 8 rows? Are the buttons in the DOM
// with the expected listener? What happens on click?
const probe = await page.evaluate(() => {
  const screen = document.getElementById("screen-settings");
  const overlay = document.getElementById("settings-modal-overlay");
  const rowsEl = document.getElementById("settings-profile-rows");
  const btns = Array.from(document.querySelectorAll(".settings-row-edit"));
  return {
    screenHidden: screen?.classList.contains("hidden"),
    screenDisplay: screen ? getComputedStyle(screen).display : "missing",
    overlayExists: !!overlay,
    overlayHasHidden: overlay?.classList.contains("hidden"),
    overlayDisplay: overlay ? getComputedStyle(overlay).display : "missing",
    overlayPointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : "missing",
    overlayZ: overlay ? getComputedStyle(overlay).zIndex : "missing",
    rowsHTMLPreview: rowsEl?.innerHTML.slice(0, 220),
    btnCount: btns.length,
    btnFields: btns.map((b) => b.dataset.field),
    firstBtnPointerEvents: btns[0] ? getComputedStyle(btns[0]).pointerEvents : "missing",
    firstBtnDisabled: btns[0]?.disabled,
  };
});
console.log("PROBE BEFORE CLICK:", JSON.stringify(probe, null, 2));

if (probe.btnCount > 0) {
  // Click "Muokkaa" on first row.
  const result = await page.evaluate(() => {
    const btn = document.querySelector('.settings-row-edit[data-field="exam_date"]');
    btn.click();
    const overlay = document.getElementById("settings-modal-overlay");
    return {
      clicked: !!btn,
      overlayHiddenAfter: overlay?.classList.contains("hidden"),
      overlayDisplayAfter: overlay ? getComputedStyle(overlay).display : "missing",
      modalBodyHTML: document.getElementById("settings-modal-body")?.innerHTML?.slice(0, 200),
      modalTitle: document.getElementById("settings-modal-title")?.textContent,
    };
  });
  console.log("AFTER click[exam_date]:", JSON.stringify(result, null, 2));

  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "loop-37-after-click.png"), fullPage: false });
}

// Final: try the real DOM-event path (synthetic mouseup/click) instead of .click()
const realClickResult = await page.evaluate(async () => {
  // Close any open modal first.
  document.getElementById("settings-modal-overlay")?.classList.add("hidden");
  // Re-find a button.
  const btn = document.querySelector('.settings-row-edit[data-field="preferred_session_length"]');
  if (!btn) return { reason: "no-btn" };
  btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 50));
  const overlay = document.getElementById("settings-modal-overlay");
  return {
    overlayHiddenAfter: overlay?.classList.contains("hidden"),
    modalTitle: document.getElementById("settings-modal-title")?.textContent,
  };
});
console.log("AFTER dispatchEvent[preferred_session_length]:", JSON.stringify(realClickResult, null, 2));

await ctx.close();
await browser.close();

if (errors.length) console.error("CONSOLE:\n" + errors.join("\n"));
else console.log("(no console errors)");
