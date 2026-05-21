// v249 final verify: oppimispolku-index now shows lessonsCompleted > 0
// for testpro123, and a freshly inserted user_curriculum_progress row
// surfaces in the UI on next render.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "testpro123@gmail.com";
const PASSWORD = "Testpro123";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
const responses = [];
page.on("response", async (r) => {
  if (r.url().includes("/api/curriculum")) {
    let body = null; try { body = await r.json(); } catch {}
    responses.push({ status: r.status(), body });
  }
});

await page.addInitScript(() => { localStorage.setItem("puheo_gate_ok_v1", "1"); });
await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);

await page.evaluate(async ({ email, password, base }) => {
  const res = await fetch(base + "/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("puheo_token", data.token);
    localStorage.setItem("puheo_email", email);
  }
}, { email: EMAIL, password: PASSWORD, base: BASE });

await page.evaluate(() => { location.hash = "#/oppimispolku?lang=es"; });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const rows = await page.evaluate(() => Array.from(document.querySelectorAll(".op-row")).map((r) => ({
  kurssi: r.dataset.kurssi,
  cls: r.className,
  text: r.textContent.trim().replace(/\s+/g, " ").slice(0, 140),
})));
console.log("Oppimispolku-index rows after fix:");
rows.forEach((r) => console.log("  " + r.kurssi + ": " + r.text));

await page.screenshot({ path: "scripts/agent-test/screenshots/v249-oppimispolku-fixed.png", fullPage: true });

const apiBody = responses[responses.length - 1]?.body;
console.log("\n/api/curriculum kurssi_1.lessonsCompleted:", apiBody?.kurssit?.[0]?.lessonsCompleted);

const kurssi1Row = rows.find((r) => r.kurssi === "kurssi_1");
const PASS = !!kurssi1Row && kurssi1Row.text.includes("1 / 10 oppituntia");
console.log("\n=== v249 UI PASS:", PASS, "===");

await ctx.close(); await browser.close();
process.exit(PASS ? 0 : 1);
