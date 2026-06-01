// L-V344 WordDive dashboard verification (2026-06-01).
// Supersedes the v271/v289 assertions. Asserts the new Aloitus surface:
//   - app canvas is warm CREAM (not near-white)
//   - koepäivä-countdown block renders with a numeric "N päivää"
//   - next-lesson card carries exactly one brick CTA (data-cta-primary)
//   - the card title is Fredoka (display font), never Fraunces/serif
//   - no em-dashes in Finnish copy
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('home renders the L-V344 WordDive dashboard', async ({ page }) => {
  test.setTimeout(120_000);

  // Pre-launch gate bypass (memory: feedback_playwright_gate.md).
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
    await page.waitForTimeout(3000);
  }

  // 1. App canvas is warm cream (#FBF7EF ≈ rgb(251,247,239)): warm, NOT white.
  //    b-channel sits clearly below the r-channel, which a neutral white never does.
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const rgb = bg.match(/\d+/g)?.map(Number) || [];
  expect(rgb.length).toBeGreaterThanOrEqual(3);
  expect(rgb[0]).toBeGreaterThanOrEqual(246);          // light
  expect(rgb[0] - rgb[2]).toBeGreaterThanOrEqual(6);   // warm (r > b)

  // 2. Countdown block renders with a numeric day count.
  const countdown = page.locator('#home-root .dash-block--countdown');
  await expect(countdown).toBeVisible();
  await expect(countdown).toContainText(/päivää/);
  const days = await countdown.locator('.dash-block__num').innerText();
  expect(Number(days)).toBeGreaterThan(0);

  // 3. Next-lesson card with exactly one primary brick CTA.
  const card = page.locator('#home-root .dash-card').first();
  await expect(card).toBeVisible();
  const cta = page.locator('#home-root [data-cta-primary="true"]');
  await expect(cta).toHaveCount(1);
  await expect(cta).toContainText(/Jatka|Aloita|Avaa/);

  // 4. Title uses the Fredoka display font, never Fraunces / a serif.
  const titleFamily = await card.locator('.dash-card__title').evaluate(
    (el) => getComputedStyle(el).fontFamily,
  );
  expect(titleFamily).toMatch(/^["']?Fredoka/i);
  expect(titleFamily).not.toMatch(/Fraunces|Plus Jakarta|Manrope/i);

  // 5. No em-dashes anywhere in the dashboard copy.
  const bodyText = await page.locator('#home-root').innerText();
  expect(bodyText).not.toMatch(/—/);

  // 6. Capture screenshots for visual review.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-v344-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-v344-mobile.png'), fullPage: true });
});
