// Loop 31 — verify 3D tilt + cursor-tracked glare on the .mode-btn cards.
// Forces the start screen visible, then dispatches a synthetic pointermove
// at an off-centre point on the second mode button and captures the result.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(`console.error: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "ronja.virtanen@gmail.com");
  window._userProfile = { onboarding_completed: true, starting_level: "B" };
});

// Stub auth-blocking endpoints minimally — for this test we only need the
// start screen to be in the DOM, not for any navigation to succeed.
await page.route("**/api/profile", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { onboarding_completed: true, starting_level: "B" } }) }));
await page.route("**/api/dashboard", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/profile/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, email: "ronja.virtanen@gmail.com" }) }));
await page.route("**/api/sr/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0, due: [] }) }));
await page.route("**/api/learning-path", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ path: [] }) }));
await page.route("**/api/progression/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
await page.route("**/api/adaptive/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ levelProgress: 0 }) }));
await page.route("**/api/topics/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
await page.route("**/api/placement/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ needed: false }) }));
await page.route("**/api/config", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1500);

// Force the start screen visible so the .mode-picker is on stage.
await page.evaluate(() => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const start = document.getElementById("screen-start");
  if (start) start.classList.add("active");
  // Make sure the L31 cardTilt module has actually run.
  return import("/js/features/cardTilt.js").then((m) => {
    m.enableCardTilt(".mode-picker .mode-btn:not(.mode-locked)");
  });
});

// Resting state — no hover.
await page.screenshot({ path: path.join(OUT, "loop-31-mode-rest.png"), fullPage: false });

// Hover into the upper-right of the second mode button (data-mode="grammar")
// so the tilt rotates "into" the screen at that corner — the most visible
// composition of rotateX (cursor on top → tilt up) + rotateY (cursor on right
// → tilt right) + glare in the same corner.
const grammarBtn = await page.$(".mode-picker .mode-btn[data-mode='grammar']");
if (!grammarBtn) {
  errors.push("grammar mode button not found");
} else {
  const box = await grammarBtn.boundingBox();
  // Use Playwright's native mouse to dispatch a real pointermove (synthesizes
  // pointer events that match what the listener expects).
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.20, { steps: 8 });
  await page.waitForTimeout(280);

  const tiltState = await page.evaluate(() => {
    const el = document.querySelector(".mode-picker .mode-btn[data-mode='grammar']");
    return {
      rx: el.style.getPropertyValue("--tilt-rx"),
      ry: el.style.getPropertyValue("--tilt-ry"),
      mx: el.style.getPropertyValue("--tilt-mx"),
      my: el.style.getPropertyValue("--tilt-my"),
      glare: el.style.getPropertyValue("--tilt-glare-opacity"),
    };
  });
  console.log("tiltState:", tiltState);

  await page.screenshot({ path: path.join(OUT, "loop-31-mode-tilt-hover.png"), fullPage: false });

  // Zoomed clip of just the mode picker so the tilt is easy to see.
  const pickerBox = await page.evaluate(() => {
    const el = document.querySelector(".mode-picker");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.floor(r.x) - 16, y: Math.floor(r.y) - 16, width: Math.ceil(r.width) + 32, height: Math.ceil(r.height) + 32 };
  });
  if (pickerBox) {
    await page.screenshot({ path: path.join(OUT, "loop-31-mode-tilt-clip.png"), clip: pickerBox });
  }
}

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — mode tilt screenshots saved");
