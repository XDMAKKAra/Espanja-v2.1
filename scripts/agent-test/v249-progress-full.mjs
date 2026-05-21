// v249 full flow: (1) mark new sivu done, verify POST + DB persist;
// (2) check oppimispolku-index renders correct lessonsCompleted.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "testpro123@gmail.com";
const PASSWORD = "Testpro123";
// Pick a sivu that's NOT already done (per DB: kurssi_1 lesson 1 has
// teoria done; phase-0 is fresh).
const FRESH_LESSON = 1;
const FRESH_SIVU = "phase-0";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();

const captured = { posts: [], gets: [] };
page.on("response", async (r) => {
  const url = r.url();
  if (url.includes("/api/digikirja/progress") || url.includes("/api/curriculum")) {
    let body = null; try { body = await r.json(); } catch {}
    const entry = { status: r.status(), method: r.request().method(), url: url.split(BASE)[1] || url, body };
    if (entry.method === "POST") captured.posts.push(entry);
    else captured.gets.push(entry);
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

await page.evaluate(() => {
  Object.keys(localStorage).filter((k) => k.startsWith("puheo:dk:progress")).forEach((k) => localStorage.removeItem(k));
  location.hash = `#/oppitunti/es/kurssi_1/${1}/teoria`;
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);

// Probe initial state
const initial = await page.evaluate((sivu) => {
  const row = document.querySelector(`.dk__row[data-sivu="${sivu}"]`);
  return { isDone: row?.classList.contains("is-done"), exists: !!row, chip: document.getElementById("dk-progress-chip")?.textContent };
}, FRESH_SIVU);
console.log("Initial state for", FRESH_SIVU, JSON.stringify(initial));

// Mark phase-0 done by calling markSivuDone directly via the module.
// (Marking would normally happen when user reaches the end of the phase.)
const postCountBefore = captured.posts.length;
await page.evaluate(async (sivu) => {
  // Find the exported markSivuDone or trigger via DOM. The sidemenu rows
  // navigate, they don't mark. Marking happens from the phase completion.
  // Easier path: directly hit /api/digikirja/progress to simulate it.
  const token = localStorage.getItem("puheo_token");
  const res = await fetch("/api/digikirja/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lang: "es", kurssi: "kurssi_1", lesson: 1, sivuId: sivu }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}, FRESH_SIVU);

await page.waitForTimeout(800);

// Reload to re-fetch from server (clear any cache effects).
await page.evaluate(() => {
  Object.keys(localStorage).filter((k) => k.startsWith("puheo:dk:progress")).forEach((k) => localStorage.removeItem(k));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);

const afterReload = await page.evaluate((sivu) => {
  const row = document.querySelector(`.dk__row[data-sivu="${sivu}"]`);
  const allDone = Array.from(document.querySelectorAll(".dk__row.is-done")).map((r) => r.dataset.sivu);
  return {
    targetDone: row?.classList.contains("is-done"),
    allDone,
    chip: document.getElementById("dk-progress-chip")?.textContent,
  };
}, FRESH_SIVU);
console.log("\nAfter POST + reload:", JSON.stringify(afterReload, null, 2));

// Test Oppimispolku index render.
await page.evaluate(() => { location.hash = "#/oppimispolku?lang=es"; });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const opSnapshot = await page.evaluate(() => {
  return Array.from(document.querySelectorAll(".op-row")).map((r) => ({
    kurssi: r.dataset.kurssi,
    cls: r.className,
    text: r.textContent.trim().replace(/\s+/g, " ").slice(0, 110),
  }));
});
console.log("\nOppimispolku-index rows:");
opSnapshot.forEach((r) => console.log("  " + r.kurssi + ": " + r.text));

await page.screenshot({ path: "scripts/agent-test/screenshots/v249-oppimispolku.png", fullPage: true });

console.log("\nNetwork POSTs:");
captured.posts.forEach((p) => console.log(`  ${p.status} POST ${p.url} → ${JSON.stringify(p.body).slice(0, 100)}`));
console.log("\nNetwork GETs (curriculum):");
captured.gets.filter((g) => g.url.includes("/api/curriculum")).forEach((g) =>
  console.log(`  ${g.status} GET ${g.url}\n    body kurssi_1.lessonsCompleted: ${g.body?.kurssit?.[0]?.lessonsCompleted}`)
);

// Direct fetch with explicit auth — bypasses any frontend code paths.
const directProbe = await page.evaluate(async () => {
  const token = localStorage.getItem("puheo_token");
  const res = await fetch("/api/curriculum?lang=es", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return {
    status: res.status,
    kurssi_1_completed: data?.kurssit?.[0]?.lessonsCompleted,
    kurssi_1_keys: Object.keys(data?.kurssit?.[0] || {}),
  };
});
console.log("\nDirect /api/curriculum probe with explicit Bearer:", JSON.stringify(directProbe));

const PASS = afterReload.targetDone === true;
console.log("\n=== fresh-sivu round-trip PASS:", PASS, "===");

await ctx.close(); await browser.close();
process.exit(PASS ? 0 : 1);
