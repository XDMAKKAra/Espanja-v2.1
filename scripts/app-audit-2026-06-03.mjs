// L-V365 logged-in app audit — systematic walkthrough of every authenticated
// surface for BOTH test accounts (pro + free) at desktop 1440 + mobile 390.
// Collects console errors, network ≥400, DOM slop heuristics, and full-page
// screenshots. REPORT ONLY — no fixes. Output feeds docs/audits/.
//
// Run (server must be up on :3000):
//   node scripts/app-audit-2026-06-03.mjs
// Reads TEST_PRO_EMAILS/TEST_PRO_PASSWORD + TEST_FREE_EMAILS/TEST_FREE_PASSWORD.

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(REPO, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

const ACCOUNTS = [
  { tag: "pro", email: process.env.TEST_PRO_EMAILS, pw: process.env.TEST_PRO_PASSWORD },
  { tag: "free", email: process.env.TEST_FREE_EMAILS, pw: process.env.TEST_FREE_PASSWORD },
];
for (const a of ACCOUNTS) {
  if (!a.email || !a.pw) { console.error(`FATAL: missing creds for ${a.tag}`); process.exit(1); }
}

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const TODAY = "2026-06-03";
const OUT_DIR = join(REPO, "screenshots", `app-audit-${TODAY}`);
const AUDITS_DIR = join(REPO, "docs", "audits");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(AUDITS_DIR, { recursive: true });

const PAGES = [
  { slug: "home", hash: "#/aloitus", name: "Koti / aloitus" },
  { slug: "koti", hash: "#/koti", name: "Koti (dashboard-alias)" },
  { slug: "path", hash: "#/oppimispolku", name: "Oppimispolku" },
  { slug: "profile", hash: "#/oma-sivu", name: "Profiili" },
  { slug: "settings", hash: "#/asetukset", name: "Asetukset" },
  { slug: "vocab", hash: "#/sanasto", name: "Sanasto" },
  { slug: "grammar", hash: "#/puheoppi", name: "Kielioppi" },
  { slug: "reading", hash: "#/luetun", name: "Luetun ymmärtäminen" },
  { slug: "writing", hash: "#/kirjoitus", name: "Kirjoittaminen" },
  { slug: "sentences", hash: "#/lauseet", name: "Käännä lauseet" },
  { slug: "exam", hash: "#/koeharjoitus", name: "YO-koe-simulaatio" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];

const RESULTS = { run: TODAY, base: BASE, pages: [] };

// DOM slop / data heuristics — run in the page, return flags to triage.
async function probeDom(page) {
  return await page.evaluate(() => {
    const out = {};
    const active = document.querySelector(".screen.active") || document.body;
    const text = (active.innerText || "").trim();
    out.emptyText = text.length < 20;
    out.textSample = text.slice(0, 400);
    // slop strings
    out.hasLataa = /Ladataan…|Ladataan\.\.\.|Loading…/i.test(text);
    out.hasComingSoon = /coming soon|avautuu pian|tulossa pian|TBD|lorem ipsum/i.test(text);
    out.hasEmDash = text.includes("—");
    out.hasMestari = /Mestari/.test(text);
    out.dashPlaceholder = /(^|\s)[—–-](\s|$)/.test(text) && /VALMIUS|TASO|YO-/i.test(text);
    // level/percentage exposure (V362 class bug)
    const levelMatch = text.match(/Taso\s+[A-ZIE]+\b/g);
    out.levelTexts = levelMatch ? [...new Set(levelMatch)].slice(0, 6) : [];
    const pcts = text.match(/\d{1,3}\s?%/g);
    out.percentages = pcts ? [...new Set(pcts)].slice(0, 10) : [];
    // identical card grid: count direct repeated-class children in any grid-ish container
    let maxIdentical = 0; let identicalClass = "";
    document.querySelectorAll(".screen.active *").forEach((el) => {
      const kids = Array.from(el.children);
      if (kids.length < 3) return;
      const counts = {};
      for (const k of kids) {
        const c = (k.className && typeof k.className === "string") ? k.className.trim() : "";
        if (c) counts[c] = (counts[c] || 0) + 1;
      }
      for (const [c, n] of Object.entries(counts)) {
        if (n > maxIdentical) { maxIdentical = n; identicalClass = c; }
      }
    });
    out.maxIdenticalSiblings = maxIdentical;
    out.identicalClass = identicalClass.slice(0, 80);
    // near-pure black/white backgrounds on cards/buttons
    let pureBW = 0;
    document.querySelectorAll(".screen.active button, .screen.active .card, .screen.active [class*=card]").forEach((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg === "rgb(0, 0, 0)" || bg === "rgb(255, 255, 255)") pureBW++;
    });
    out.pureBWElements = pureBW;
    // dead buttons (no text + no aria-label + not icon)
    let deadBtns = 0;
    document.querySelectorAll(".screen.active button").forEach((b) => {
      const t = (b.textContent || "").trim();
      const al = b.getAttribute("aria-label");
      if (!t && !al && !b.querySelector("svg,img,i")) deadBtns++;
    });
    out.deadButtons = deadBtns;
    return out;
  });
}

async function login(browser, viewport, acct) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.ua,
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) { try { await loginTab.click({ timeout: 3000 }); } catch {} }
  await page.locator("#auth-email").fill(acct.email);
  await page.locator("#auth-password").fill(acct.pw);
  const submitBtn = page.locator("#btn-auth-submit");
  await submitBtn.scrollIntoViewIfNeeded();
  const [loginRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/") && r.request().method() === "POST", { timeout: 15000 }),
    submitBtn.click({ force: true }),
  ]);
  if (loginRes.status() >= 400) throw new Error(`Login failed: ${loginRes.status()}`);
  await page.waitForTimeout(1800);
  return { ctx, page };
}

async function auditPage(page, pageInfo, viewport, acct) {
  const consoleErrors = [];
  const networkErrors = [];
  const handler = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 240)); };
  const respHandler = (res) => { if (res.status() >= 400 && !res.url().includes("favicon")) networkErrors.push(`${res.request().method()} ${res.status()} ${res.url().replace(BASE, "").slice(0, 160)}`); };
  const errHandler = (err) => consoleErrors.push(`UNCAUGHT: ${err.message.slice(0, 240)}`);
  page.on("console", handler);
  page.on("response", respHandler);
  page.on("pageerror", errHandler);

  let status = "ok";
  let dom = {};
  const shot = `${pageInfo.slug}-${acct.tag}-${viewport.name}.png`;
  try {
    await page.goto(BASE + "/app.html" + pageInfo.hash, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1800);
    dom = await probeDom(page);
    await page.screenshot({ path: join(OUT_DIR, shot), fullPage: true });
  } catch (err) {
    status = `error: ${err.message.slice(0, 160)}`;
  }
  page.off("console", handler);
  page.off("response", respHandler);
  page.off("pageerror", errHandler);

  return { slug: pageInfo.slug, name: pageInfo.name, hash: pageInfo.hash, account: acct.tag, device: viewport.name, status, screenshot: shot, consoleErrors, networkErrors, dom };
}

(async () => {
  console.log(`L-V365 app audit · base=${BASE} · ${PAGES.length} pages × ${ACCOUNTS.length} accts × ${VIEWPORTS.length} viewports`);
  const browser = await chromium.launch();
  for (const acct of ACCOUNTS) {
    for (const v of VIEWPORTS) {
      console.log(`\n--- ${acct.tag} / ${v.name} ---`);
      let ctx, page;
      try {
        const r = await login(browser, v, acct);
        ctx = r.ctx; page = r.page;
        console.log(`  logged in as ${acct.email}`);
      } catch (err) {
        console.error(`  LOGIN FAILED (${acct.tag}/${v.name}): ${err.message}`);
        RESULTS.pages.push({ slug: "LOGIN", account: acct.tag, device: v.name, status: `login-failed: ${err.message}`, consoleErrors: [], networkErrors: [], dom: {} });
        continue;
      }
      let idx = 0;
      for (const p of PAGES) {
        idx++;
        const start = Date.now();
        const res = await auditPage(page, p, v, acct);
        const dur = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  [${idx}/${PAGES.length}] ${res.slug} · ${res.status} · cons=${res.consoleErrors.length} net=${res.networkErrors.length} ident=${res.dom.maxIdenticalSiblings ?? "?"} lvl=${(res.dom.levelTexts||[]).join(",")} · ${dur}s`);
        RESULTS.pages.push(res);
      }
      await ctx.close();
    }
  }
  await browser.close();
  writeFileSync(join(AUDITS_DIR, `${TODAY}-app-audit-loggedin.json`), JSON.stringify(RESULTS, null, 2), "utf-8");
  console.log(`\nWrote raw JSON: docs/audits/${TODAY}-app-audit-loggedin.json`);
  console.log(`Screenshots: ${OUT_DIR}`);
})();
