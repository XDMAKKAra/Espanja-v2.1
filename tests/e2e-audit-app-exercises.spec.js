// Old-Spain exercise audit (2026-05-18, Vaihe 2). Walks into the vocab
// drill + grammar drill + reading + writing screens after login,
// snapshots desktop + mobile of each so the Old-Spain skin can be
// compared at a glance.
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

const SCREENS = [
  { hash: 'sanasto',   name: 'mode-vocab' },
  { hash: 'puheoppi',  name: 'mode-grammar' },
  { hash: 'luetun',    name: 'mode-reading' },
  { hash: 'kirjoitus', name: 'mode-writing' },
];

test('exercise mode pages old-spain', async ({ page }) => {
  test.setTimeout(180_000);

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });

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

  for (const s of SCREENS) {
    await page.goto(`/app.html#${s.hash}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(OUT_DIR, `oldspain-${s.name}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(OUT_DIR, `oldspain-${s.name}-mobile.png`), fullPage: true });
  }
});
