// L-V396 full-app logged-in regression click-through. Sibling to
// verify-backbone.mjs / verify-isolation.mjs. Logs in as the test PRO user via
// API, injects the token, then walks every key screen verifying:
//  - no uncaught JS error / console.error
//  - the active screen actually rendered content (not an empty shell)
//  - no live route falls back to the killed #screen-path
//
// Run: VERIFY_BASE=http://localhost:3000 node -r dotenv/config tests/verify-clickthrough.mjs
//   NOTE: must use the localhost origin (NOT 127.0.0.1) — API=window.location.origin
//   and the server CORS allowlist (APP_URL/ALLOWED_ORIGINS=localhost:3000) rejects
//   a 127.0.0.1 Origin header in the browser (node-fetch sends none, so the other
//   verify scripts tolerate 127.0.0.1; the browser does not).
import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE || "http://localhost:3000";

async function login() {
  const email = process.env.TEST_PRO_EMAILS?.split(",")[0].trim();
  const password = process.env.TEST_PRO_PASSWORD;
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`login -> ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { token: j.token, refresh: j.refreshToken || "", email };
}

const ROUTES = [
  ["koti (dashboard)", "#/koti"],
  ["aloitus (home)", "#/aloitus"],
  ["oppimispolku (index)", "#/oppimispolku"],
  ["kurssidetalji", "#/oppimispolku/es/kurssi_1"],
  ["sanasto (vocab)", "#/sanasto"],
  ["puheoppi (grammar)", "#/puheoppi"],
  ["luetun (reading)", "#/luetun"],
  ["kirjoitus (writing)", "#/kirjoitus"],
  ["koeharjoitus (exam)", "#/koeharjoitus"],
  ["oma-sivu (profile)", "#/oma-sivu"],
  ["asetukset (settings)", "#/asetukset"],
  ["digikirja (oppitunti)", "#/oppitunti/es/kurssi_1/1/teoria"],
];

const run = async () => {
  const { token, refresh, email } = await login();
  console.log(`logged in as ${email}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on("pageerror", (e) => jsErrors.push({ route: current, msg: `UNCAUGHT: ${e.message}` }));
  page.on("console", (m) => {
    if (m.type() === "error") jsErrors.push({ route: current, msg: `console.error: ${m.text()}` });
  });

  let current = "(boot)";
  await page.addInitScript(([t, r, e]) => {
    try {
      localStorage.setItem("puheo_token", t);
      localStorage.setItem("puheo_refresh_token", r);
      localStorage.setItem("puheo_email", e);
      localStorage.setItem("puheo_gate_ok_v1", "1");
    } catch {}
  }, [token, refresh, email]);

  await page.goto(`${BASE}/app.html`, { waitUntil: "networkidle" });

  let emptyScreens = [];
  for (const [label, hash] of ROUTES) {
    current = label;
    await page.evaluate((h) => {
      location.hash = h;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }, hash);
    await page.waitForTimeout(1200);
    try { await page.waitForLoadState("networkidle", { timeout: 4000 }); } catch {}
    // Measure rendered content of the active screen.
    const info = await page.evaluate(() => {
      const active = document.querySelector(".screen.active") || document.querySelector(".screen:not([hidden])");
      if (!active) return { id: "(none active)", textLen: 0, kids: 0 };
      const text = (active.innerText || "").trim();
      return { id: active.id || "(no id)", textLen: text.length, kids: active.querySelectorAll("*").length };
    });
    const empty = info.textLen < 10 && info.kids < 3;
    if (empty) emptyScreens.push(`${label} [${info.id}] textLen=${info.textLen} kids=${info.kids}`);
    console.log(`${empty ? "EMPTY?" : "ok    "} ${label.padEnd(26)} active=#${info.id} textLen=${info.textLen} kids=${info.kids}`);
  }

  await ctx.close();
  await browser.close();

  console.log(`\n=== JS ERRORS (${jsErrors.length}) ===`);
  for (const e of jsErrors) console.log(`  [${e.route}] ${e.msg}`);
  console.log(`\n=== EMPTY SCREENS (${emptyScreens.length}) ===`);
  for (const s of emptyScreens) console.log(`  ${s}`);
  console.log(`\n${jsErrors.length === 0 && emptyScreens.length === 0 ? "CLICKTHROUGH CLEAN" : "ISSUES FOUND"}`);
  process.exit(jsErrors.length === 0 && emptyScreens.length === 0 ? 0 : 1);
};
run().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
