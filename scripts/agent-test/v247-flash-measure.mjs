// v247 — measure the home-loading flash from screen-home.active → mode-grid visible.
import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const SLOW_FETCH_MS = parseInt(process.env.SLOW_FETCH_MS || "800", 10);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("puheo_gate_ok_v1", "1");
});

const slow = (b) => (r) => setTimeout(() =>
  r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) }), SLOW_FETCH_MS);
const ok = (b) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });

await page.route("**/api/profile", ok({ profile: { onboarding_completed: true, target_grade: "M", target_language: "es" } }));
await page.route("**/api/auth/me", ok({ ok: true, pro: true }));
// the slow one — dashboard/v2 is what loadHome awaits
await page.route("**/api/dashboard/v2", slow({
  dashboard: { streak: 3, totalSessions: 12, estLevel: "B", yoReadinessPct: 41 },
  profile: { profile: { exam_date: "2027-03-15", preferred_name: "Maria" } },
}));
await page.route("**/api/dashboard", ok({}));
await page.route("**/api/learning-path", ok({ path: [] }));
await page.route("**/api/sr/**", ok({}));
await page.route("**/api/placement/**", ok({ needed: false }));

// Inject a probe that records timestamps
await page.addInitScript(() => {
  window.__flashLog = { events: [] };
  const log = (label) => window.__flashLog.events.push({ label, t: performance.now() });
  window.__flashLog.log = log;

  // Patch MutationObserver to detect when #screen-home gains .active and when .home-modes appears.
  document.addEventListener("DOMContentLoaded", () => {
    const home = document.getElementById("screen-home");
    if (home) {
      const mo = new MutationObserver(() => {
        if (home.classList.contains("active") && !window.__flashLog._aActive) {
          window.__flashLog._aActive = true;
          log("home.active");
        }
      });
      mo.observe(home, { attributes: true, attributeFilter: ["class"] });

      const inner = new MutationObserver(() => {
        if (home.querySelector(".home-skel-root") && !window.__flashLog._aSkel) {
          window.__flashLog._aSkel = true;
          log("skeleton.visible");
        }
        if (home.querySelector(".home-modes:not([aria-hidden])") && !window.__flashLog._aModes) {
          // Live home-modes section has no aria-hidden; skeleton has it.
          window.__flashLog._aModes = true;
          log("home-modes.visible");
        }
        if (home.querySelector(".ohjaamo__grid") && !window.__flashLog._aOhjaamo) {
          window.__flashLog._aOhjaamo = true;
          log("ohjaamo-grid.any");
        }
        const live = home.querySelector(".ohjaamo:not([aria-hidden]) .ohjaamo__grid");
        if (live && !window.__flashLog._aOhjaamoLive) {
          window.__flashLog._aOhjaamoLive = true;
          log("ohjaamo.live");
        }
      });
      inner.observe(home, { childList: true, subtree: true });
    }
  });
});

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
// Simulate "after login" by setting the token and triggering home load.
const tNav = performance.now();
await page.evaluate(async (t0) => {
  window.__flashLog.events.push({ label: "boot.t0", t: t0 });
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "testpro123@gmail.com");
  window.__flashLog.log("token.set");
  const home = await import("/js/screens/home.js");
  window.__flashLog.log("loadHome.start");
  await home.loadHome();
  window.__flashLog.log("loadHome.resolved");
}, tNav);

await page.waitForTimeout(200);
const log = await page.evaluate(() => window.__flashLog.events);
console.log("EVENTS:");
log.forEach((e) => console.log(`  ${e.label.padEnd(24)} t=${e.t.toFixed(1)}ms`));

// Compute the flash duration: home.active → ohjaamo.visible.
const act = log.find((e) => e.label === "home.active");
const ohja = log.find((e) => e.label === "ohjaamo.visible");
const modes = log.find((e) => e.label === "home-modes.visible");
if (act && modes) {
  console.log(`\nFLASH (home.active → home-modes.visible): ${(modes.t - act.t).toFixed(0)}ms`);
}
if (act && ohja) {
  console.log(`FLASH (home.active → ohjaamo.visible):    ${(ohja.t - act.t).toFixed(0)}ms`);
}

await page.screenshot({ path: "scripts/agent-test/screenshots/v247-after-load.png" });
await ctx.close(); await browser.close();
