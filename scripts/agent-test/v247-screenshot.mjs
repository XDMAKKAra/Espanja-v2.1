// Visual: screenshot the skeleton mid-fetch + the live render.
import { chromium } from "playwright";
const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "testpro123@gmail.com");
  localStorage.setItem("puheo_gate_ok_v1", "1");
});

let releaseDashboard;
const dashboardPromise = new Promise((res) => { releaseDashboard = res; });
const ok = (b) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
await page.route("**/api/profile", ok({ profile: { onboarding_completed: true, target_grade: "M", target_language: "es" } }));
await page.route("**/api/auth/me", ok({ ok: true, pro: true }));
await page.route("**/api/dashboard/v2", async (r) => {
  await dashboardPromise;
  r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    dashboard: { streak: 3, totalSessions: 12, estLevel: "B", yoReadinessPct: 41 },
    profile: { profile: { exam_date: "2027-03-15", preferred_name: "Maria" } },
  })});
});
await page.route("**/api/dashboard", ok({}));
await page.route("**/api/learning-path", ok({ path: [] }));
await page.route("**/api/sr/**", ok({}));
await page.route("**/api/placement/**", ok({ needed: false }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const homeP = page.evaluate(async () => {
  const m = await import("/js/screens/home.js");
  return m.loadHome();
});
await page.waitForTimeout(200); // skeleton phase
await page.screenshot({ path: "scripts/agent-test/screenshots/v247-skeleton.png" });
console.log("skeleton screenshot taken");

releaseDashboard();
await homeP;
await page.waitForTimeout(200);
await page.screenshot({ path: "scripts/agent-test/screenshots/v247-live.png" });
console.log("live screenshot taken");
await ctx.close(); await browser.close();
