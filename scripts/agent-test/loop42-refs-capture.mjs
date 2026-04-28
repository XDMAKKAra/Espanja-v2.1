// Loop 42 Section A(b) — capture reference-site screenshots for the landing rebuild.
// Visits Linear / Vercel / Stripe / Cal.com Cron / Duolingo (counter-example) and
// saves a hero-area + below-fold shot of each into references/landing/<site>/.
//
// These screenshots feed the curator-discipline ledger lines for L43+ (every
// landing component must cite the source, and the source must exist in-repo).
//
// Run: node scripts/agent-test/loop42-refs-capture.mjs

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SITES = [
  { slug: "linear",   url: "https://linear.app/" },
  { slug: "vercel",   url: "https://vercel.com/" },
  { slug: "stripe",   url: "https://stripe.com/" },
  { slug: "cron",     url: "https://cal.com/" }, // cron.com folded into cal.com
  { slug: "duolingo", url: "https://www.duolingo.com/" },
];

const VIEWPORT = { width: 1440, height: 900 };
const ROOT = path.resolve("references/landing");

async function captureSite({ slug, url }) {
  const dir = path.join(ROOT, slug);
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  console.log(`[${slug}] navigating ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch (e) {
    console.warn(`[${slug}] goto failed: ${e.message}`);
    await browser.close();
    return { slug, ok: false, error: e.message };
  }

  // Give late-loading hero animations a moment to settle.
  await page.waitForTimeout(2500);

  // Try to dismiss any common cookie banner so screenshots are clean.
  // Best-effort: don't fail the run if the selector doesn't match.
  const cookieDismissals = [
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("Hyväksy")',
    'button:has-text("Got it")',
    '[data-testid="cookie-accept"]',
  ];
  for (const sel of cookieDismissals) {
    try {
      const btn = await page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1000 });
        console.log(`[${slug}] dismissed cookie banner via ${sel}`);
        await page.waitForTimeout(600);
        break;
      }
    } catch { /* keep trying */ }
  }

  // Hero shot — viewport, top of page.
  const heroPath = path.join(dir, "hero-1440.png");
  try {
    await page.screenshot({ path: heroPath, fullPage: false });
    console.log(`[${slug}] saved ${heroPath}`);
  } catch (e) {
    console.warn(`[${slug}] hero shot failed: ${e.message}`);
  }

  // Below-the-fold shot — scroll one viewport down, settle, capture.
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(800);
  const belowPath = path.join(dir, "below-fold-1440.png");
  try {
    await page.screenshot({ path: belowPath, fullPage: false });
    console.log(`[${slug}] saved ${belowPath}`);
  } catch (e) {
    console.warn(`[${slug}] below-fold shot failed: ${e.message}`);
  }

  await browser.close();
  return { slug, ok: true, files: [heroPath, belowPath] };
}

const results = [];
for (const site of SITES) {
  const r = await captureSite(site);
  results.push(r);
}

console.log("\n=== Capture summary ===");
for (const r of results) {
  console.log(r.ok ? `OK   ${r.slug}` : `FAIL ${r.slug} — ${r.error}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
