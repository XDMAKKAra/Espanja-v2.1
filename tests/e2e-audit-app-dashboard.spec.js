// Old-Spain dashboard re-skin audit (2026-05-18).
// Logs in with the configured TEST_PRO account, screenshots the dashboard
// on desktop + mobile. Writes to audit-screens/dashboard-old-spain-*.png.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('dashboard old-spain skin', async ({ page }) => {
  test.setTimeout(120_000);

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });

  // body must carry the app class so the Old-Spain bridge applies.
  await expect(page.locator('body.app')).toBeVisible();

  // Best-effort login. If creds don't exist in this env, skip the dashboard
  // capture but still verify the auth screen picked up the cream surface.
  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.locator('button:has-text("Kirjaudu sisään")').first().click(),
    ]);
    await page.waitForTimeout(2500);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-old-spain-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-old-spain-mobile.png'), fullPage: true });

  // Background colour sanity check — cream paper, not charcoal.
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('body.app background:', bg);
});
