// L-V324 — focused local probe for settings-page mobile CLS.
// Boots a logged-in mobile context, navigates to #/asetukset, and prints
// every layout-shift entry with the attributed source element so we can
// see the fix mechanism work without running the full 40-scan audit.
//
// Usage: node scripts/probe-settings-cls.mjs            (defaults to localhost:3000)
//        AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/probe-settings-cls.mjs

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(REPO, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}
const BASE  = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_LOGIN_EMAIL;
const PW    = process.env.TEST_LOGIN_PASSWORD;
if (!EMAIL || !PW) { console.error("Missing TEST_LOGIN_EMAIL/PASSWORD in .env"); process.exit(1); }

const VP = process.env.PROBE_VIEWPORT === "desktop"
  ? { width: 1280, height: 800, userAgent: undefined }
  : { width: 390, height: 844, userAgent: devices["iPhone 13"].userAgent };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: VP.width, height: VP.height },
    userAgent: VP.userAgent,
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });

  // Login
  const lp = await ctx.newPage();
  await lp.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
  const tab = lp.locator("#tab-login"); if (await tab.count()) { try { await tab.click({ timeout: 2000 }); } catch {} }
  await lp.locator("#auth-email").fill(EMAIL);
  await lp.locator("#auth-password").fill(PW);
  await Promise.all([
    lp.waitForResponse((r) => r.url().includes("/api/auth/") && r.request().method() === "POST"),
    lp.locator("#btn-auth-submit").click({ force: true }),
  ]);
  await lp.waitForTimeout(800);
  await lp.close();

  // Fresh page: navigate directly to #/asetukset with cache-busting query so
  // PerformanceObserver attaches to a real document load (not a hash flip).
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        const src = (e.sources || []).map((s) => {
          const n = s.node;
          if (!n) return "(no-node)";
          const id = n.id ? `#${n.id}` : "";
          const cls = n.className && typeof n.className === "string" ? `.${n.className.replace(/\s+/g, ".")}` : "";
          const tag = (n.tagName || "?").toLowerCase();
          return `${tag}${id}${cls}`.slice(0, 100);
        });
        window.__shifts.push({ value: e.value, t: Math.round(e.startTime), sources: src });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  const url = `${BASE}/app.html?t=${Date.now()}#/asetukset`;
  console.log(`Navigating: ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000); // let CLS settle

  const shifts = await page.evaluate(() => window.__shifts || []);
  const total = shifts.reduce((s, x) => s + x.value, 0);

  console.log(`\n=== Settings mobile CLS ===`);
  console.log(`Total CLS: ${total.toFixed(4)}  (threshold: ≤ 0.1 good, ≤ 0.25 NI)`);
  console.log(`Shift count: ${shifts.length}`);
  if (shifts.length) {
    console.log("\nPer-shift breakdown:");
    for (const s of shifts) {
      console.log(`  t=${s.t}ms  value=${s.value.toFixed(4)}  sources=${s.sources.join(", ")}`);
    }
  }
  console.log(`\nVerdict: ${total <= 0.1 ? "GOOD ✓" : total <= 0.25 ? "NEEDS-IMPROVEMENT ⚠" : "POOR ✗"}`);

  await browser.close();
  process.exit(total <= 0.1 ? 0 : 1);
})().catch((err) => { console.error(err); process.exit(2); });
