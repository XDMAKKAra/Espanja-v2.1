// L-V370 before/after capture. Logs in as TEST_PRO, screenshots the three
// surfaces the brief targets: home dashboard, course-1 lesson list, and the
// consent banner. Usage: node scripts/v370-capture.mjs <tag>  (tag = before|after)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TAG = process.argv[2] || 'before';
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || 'Testpro123';
const BASE = 'http://localhost:3000';
const OUT = path.resolve('screenshots', `v370-${TAG}`);
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log('shot', name);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });

// 1. Consent banner — fresh state (no consent key), home before login.
await page.goto(`${BASE}/app.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await shot(page, 'consent-banner-desktop');

// Log in.
const email = page.locator('#auth-email');
if (await email.isVisible().catch(() => false)) {
  await email.fill(EMAIL);
  await page.locator('#auth-password').fill(PASS);
  await page.locator('button:has-text("Kirjaudu sisään")').first().click();
  await page.waitForTimeout(3500);
}

// 2. Home dashboard.
await page.goto(`${BASE}/app.html#/aloitus`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.setViewportSize(DESKTOP);
await shot(page, 'home-desktop');
await page.setViewportSize(MOBILE);
await page.waitForTimeout(400);
await shot(page, 'home-mobile');

// 3. Course list (oppimispolku index) then course-1 detail.
await page.setViewportSize(DESKTOP);
await page.goto(`${BASE}/app.html#/oppimispolku?lang=es`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await shot(page, 'oppimispolku-index-desktop');
const firstRow = page.locator('.op-row.is-clickable').first();
if (await firstRow.isVisible().catch(() => false)) {
  await firstRow.click();
  await page.waitForTimeout(2500);
  await shot(page, 'course-detail-desktop');
  await page.setViewportSize(MOBILE);
  await page.waitForTimeout(400);
  await shot(page, 'course-detail-mobile');
}

await browser.close();
console.log('done ->', OUT);
