// Dev helper: screenshot an app screen as a logged-in test user.
// Usage: node scripts/shot-app.mjs "<hash>" <outname> [width] [height] [collapsed]
// Example: node scripts/shot-app.mjs "#/oppitunti/es/kurssi_2/3/teoria" dk-before 1366 900
import { chromium } from "playwright";

const [hash = "", name = "shot", w = "1366", h = "900", collapsed = ""] = process.argv.slice(2);
const BASE = "http://localhost:3000";

const login = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "testpro123@gmail.com", password: "Testpro123" }),
});
const auth = await login.json();
if (!auth.token) {
  console.error("login failed:", auth);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: +w, height: +h } })).newPage();
await page.addInitScript(([t, r, e, c]) => {
  localStorage.setItem("puheo_gate_ok_v1", "1");
  localStorage.setItem("puheo_token", t);
  if (r) localStorage.setItem("puheo_refresh", r);
  if (e) localStorage.setItem("puheo_email", e);
  if (c) localStorage.setItem("puheo_sidebar_collapsed", "1");
}, [auth.token, auth.refreshToken || "", auth.email || "", collapsed]);

const errors = [];
page.on("pageerror", (er) => errors.push(String(er)));
await page.goto(`${BASE}/app.html${hash}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: `docs/audits/l-v413-${name}.png`, fullPage: false });
console.log("active screen:", await page.evaluate(() => document.querySelector(".screen.active")?.id));
console.log("errors:", errors.length ? errors.join(" | ").slice(0, 400) : "none");
console.log(`saved docs/audits/l-v413-${name}.png`);
await browser.close();
