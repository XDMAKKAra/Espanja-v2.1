// v248 verify — nickname persists across origin change (simulated by
// clearing localStorage between login sessions).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "testpro123@gmail.com";
const PASSWORD = "Testpro123";
const NICKNAME = "Marcel";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });

await page.addInitScript(() => {
  localStorage.setItem("puheo_gate_ok_v1", "1");
});

// ── Phase 1: log in fresh, set nickname ────────────────────────────────────
await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);

// Direct login via API since auth UI flow is complex; mirrors what
// the app does internally.
const loginResp = await page.evaluate(async ({ email, password, base }) => {
  const res = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("puheo_token", data.token);
    localStorage.setItem("puheo_email", email);
  }
  return { status: res.status, hasToken: !!data.token, error: data.error };
}, { email: EMAIL, password: PASSWORD, base: BASE });
console.log("LOGIN:", JSON.stringify(loginResp));
if (!loginResp.hasToken) { console.error("Login failed, aborting"); process.exit(1); }

// Reload to land on home with the new token.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

// Read the sidebar before setting nickname.
const sidebarBefore = await page.evaluate(() => document.getElementById("sidebar-user")?.textContent);
console.log("Sidebar before nickname:", JSON.stringify(sidebarBefore));

// Navigate to Settings via the real sidebar nav (triggers initSettings).
await page.click("#nav-settings");
await page.waitForSelector("#settings-nickname-input", { state: "visible" });
await page.waitForTimeout(1200); // /api/profile fetch + populate

// Install POST /api/profile interceptor BEFORE the click.
await page.evaluate(() => {
  window.__lastProfilePost = null;
  const orig = window.fetch;
  window.fetch = async function(url, opts) {
    const r = await orig.call(this, url, opts);
    const u = typeof url === "string" ? url : (url?.url || "");
    if (u.includes("/api/profile") && opts?.method === "POST") {
      window.__lastProfilePost = { status: r.status };
      try { window.__lastProfilePost.body = await r.clone().json(); } catch {}
    }
    return r;
  };
});
// Type nickname + save.
await page.fill("#settings-nickname-input", NICKNAME);
await page.click("#settings-nickname-save");
await page.waitForTimeout(1500);
const saveResp = await page.evaluate(() => window.__lastProfilePost);
console.log("Save response:", JSON.stringify(saveResp).slice(0, 250));

// Sidebar should now show the nickname.
const sidebarAfterSave = await page.evaluate(() => document.getElementById("sidebar-user")?.textContent);
console.log("Sidebar after save:", JSON.stringify(sidebarAfterSave));

// ── Phase 2: simulate origin change (clear localStorage), re-login ─────────
console.log("\n--- Simulating origin change: clearing localStorage ---");
await page.evaluate(() => {
  const keep = ["puheo_gate_ok_v1"];
  Object.keys(localStorage).filter((k) => !keep.includes(k)).forEach((k) => localStorage.removeItem(k));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);

// Log in again.
await page.evaluate(async ({ email, password, base }) => {
  const res = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("puheo_token", data.token);
    localStorage.setItem("puheo_email", email);
  }
}, { email: EMAIL, password: PASSWORD, base: BASE });

// Verify the localStorage["puheo:nickname"] is empty at this point
// (we cleared it). The whole point is the nickname should come from
// the server profile, not from cache.
const storedAfterClear = await page.evaluate(() => localStorage.getItem("puheo:nickname"));
console.log("localStorage[puheo:nickname] right after clear+login:", JSON.stringify(storedAfterClear));

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000); // give /api/profile time to resolve

const sidebarAfterReload = await page.evaluate(() => document.getElementById("sidebar-user")?.textContent);
const storedAfterReload = await page.evaluate(() => localStorage.getItem("puheo:nickname"));
const profileNick = await page.evaluate(() => window._userProfile?.nickname);
console.log("Sidebar after origin-clear re-login:", JSON.stringify(sidebarAfterReload));
console.log("localStorage[puheo:nickname] after reload:", JSON.stringify(storedAfterReload));
console.log("window._userProfile.nickname:", JSON.stringify(profileNick));

await page.screenshot({ path: "scripts/agent-test/screenshots/v248-after-origin-change.png" });

// PASS criterion: sidebar shows NICKNAME, not the email
const PASS = sidebarAfterReload?.includes(NICKNAME) && profileNick === NICKNAME;
console.log("\n=== v248 PASS:", PASS, "===");

if (errors.length) {
  console.log("\nConsole errors (some may be unrelated):");
  errors.forEach((e) => console.log("  " + e.slice(0, 200)));
}

await ctx.close(); await browser.close();
process.exit(PASS ? 0 : 1);
