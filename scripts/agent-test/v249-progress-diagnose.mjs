// v249 — Diagnose: does the digikirja sidemenu actually render "done"
// markers from the server? testpro123 has 4 rows in user_lesson_progress
// (verified via Supabase MCP). If the markers don't paint after
// hydrateFromServer(), that's bug (b): backend saves, UI doesn't read.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "testpro123@gmail.com";
const PASSWORD = "Testpro123";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();

const requests = [];
page.on("request", (r) => {
  const url = r.url();
  if (url.includes("/api/digikirja/progress") || url.includes("/api/curriculum")) {
    requests.push({ method: r.method(), url: url.split(BASE)[1] || url });
  }
});
const responses = [];
page.on("response", async (r) => {
  const url = r.url();
  if (url.includes("/api/digikirja/progress") || url.includes("/api/curriculum")) {
    let body = null;
    try { body = await r.json(); } catch {}
    responses.push({ status: r.status(), url: url.split(BASE)[1] || url, body });
  }
});

await page.addInitScript(() => {
  localStorage.setItem("puheo_gate_ok_v1", "1");
});

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);

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

// Clear stale localStorage progress so we test the server hydration path.
await page.evaluate(() => {
  Object.keys(localStorage).filter((k) => k.startsWith("puheo:digikirja:progress")).forEach((k) => localStorage.removeItem(k));
});

// Navigate directly to kurssi_1, lesson 1 (testpro has user_lesson_progress for teoria sivu).
await page.evaluate(() => { location.hash = "#/oppitunti/es/kurssi_1/1/teoria"; });
// Trigger a hashchange-driven router run by reload, since direct hash
// assignment after page settle doesn't always fire the boot router.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000); // boot + hydrate + render

// Capture state
const snapshot = await page.evaluate(() => {
  const list = document.getElementById("dk-sidemenu-list");
  const rows = list ? Array.from(list.querySelectorAll(".dk__row")).map((r) => ({
    sivu: r.dataset.sivu,
    isDone: r.classList.contains("is-done"),
    text: r.textContent.trim().slice(0, 60),
  })) : [];
  const chip = document.getElementById("dk-progress-chip")?.textContent;
  const localProgress = {};
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("puheo:digikirja:progress")) {
      localProgress[k] = localStorage.getItem(k);
    }
  }
  return { rowCount: rows.length, rows, chip, localProgress };
});
console.log("\nDigikirja state for kurssi_1 lesson 1:");
console.log(JSON.stringify(snapshot, null, 2));

console.log("\nNetwork (digikirja/progress + curriculum):");
requests.forEach((r) => console.log(`  → ${r.method} ${r.url}`));
console.log("\nResponses:");
responses.forEach((r) => console.log(`  ← ${r.status} ${r.url} ${JSON.stringify(r.body).slice(0, 200)}`));

await page.screenshot({ path: "scripts/agent-test/screenshots/v249-diagnose.png", fullPage: true });
await ctx.close(); await browser.close();
