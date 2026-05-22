// v271 dashboard-redesign verification (2026-05-22).
// Brief: docs/briefs/2026-05-22-dashboard-redesign.md.
//
// Asserts the new Aloitus surface:
//   - body is near-white (NOT cream beige)
//   - Hei-greeting + date pill render
//   - Primary "Jatka tästä" card with brick CTA exists
//   - Päivän tavoite (goal bar) renders
//   - Kurssipolku snapshot ships exactly 4 micro-tiles
//   - AI-slop bans hold: no italic-Fraunces greeting, no UPPERCASE "8 KURSSIA"
//     eyebrow, no em-dashes in copy.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('home renders the v271 redesign shell', async ({ page }) => {
  test.setTimeout(120_000);

  // Pre-launch gate bypass — addInitScript runs before any inline JS so the
  // prompt() in pre-launch-gate.js never throws (memory:
  // feedback_playwright_gate.md).
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body.app')).toBeVisible();

  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);
  }

  // 1. App canvas is near-white. RGB tolerance because OKLCH→RGB rounds.
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const rgb = bg.match(/\d+/g)?.map(Number) || [];
  expect(rgb.length).toBeGreaterThanOrEqual(3);
  expect(rgb[0]).toBeGreaterThanOrEqual(248);
  expect(rgb[1]).toBeGreaterThanOrEqual(248);
  expect(rgb[2]).toBeGreaterThanOrEqual(245);

  // 2. Greeting reads "Hei" and is NOT italic Fraunces.
  const greeting = page.locator('#home-root .home-greeting').first();
  await expect(greeting).toBeVisible();
  await expect(greeting).toContainText(/Hei/);
  const greetingStyle = await greeting.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { style: cs.fontStyle, family: cs.fontFamily };
  });
  expect(greetingStyle.style).toBe('normal');
  expect(greetingStyle.family).toMatch(/Fraunces/i);

  // 3. Date pill renders.
  await expect(page.locator('#home-root .home-date-pill')).toBeVisible();

  // 4. Primary "Jatka tästä?" card exists with a single brick CTA.
  const card = page.locator('#home-root .home-continue');
  await expect(card).toBeVisible();
  await expect(card.locator('.home-continue__cta')).toContainText(/Jatka|Aloita/);

  // 5. Päivän tavoite renders with a progressbar.
  await expect(page.locator('#home-root .home-goal__bar')).toBeVisible();

  // 6. Kurssipolku snapshot ships exactly 4 micro-tiles.
  await expect(page.locator('#home-root .home-track')).toHaveCount(4);

  // 7. AI-slop bans — none of the killed strings can appear.
  const bodyText = await page.locator('#home-root').innerText();
  expect(bodyText).not.toMatch(/Päivää\./);
  expect(bodyText).not.toMatch(/8 KURSSIA · 80 OPPITUNTIA/);
  expect(bodyText).not.toMatch(/YO-VALMIUS\s*—/);
  expect(bodyText).not.toMatch(/—/); // em-dash banned in Finnish copy

  // 8. Capture screenshots for visual review.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-v271-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-v271-mobile.png'), fullPage: true });
});
