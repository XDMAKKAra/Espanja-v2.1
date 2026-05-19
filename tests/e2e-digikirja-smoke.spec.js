// PR1+2 smoke: Otava Fokus 7 three-panel digikirja screen.
// PR1 verified the shell renders + SideMenu navigation + toggle persist.
// PR2 verifies real lesson JSON is fetched, teoria sivu renders the
// teaching markdown (BilingualTable + InfoBox + key points), and the
// SideMenu's sivu list is derived from the lesson's phases.
import { test, expect } from '@playwright/test';
import path from 'path';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

async function login(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
  await page.goto('/app.html');
  await page.waitForLoadState('networkidle').catch(() => {});
  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForTimeout(2200);
  }
}

const DEMO_HASH = '#/oppitunti/es/kurssi_2/3/teoria';

test('digikirja shell renders the real Ruoka ja ateriat lesson', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.evaluate((h) => { location.hash = h; }, DEMO_HASH);
  await page.waitForTimeout(1200);

  const active = await page.evaluate(() => document.querySelector('.screen.active')?.id);
  expect(active).toBe('screen-digikirja');

  // TopBar title comes from lesson_3.json meta.title.
  await expect(page.locator('.dk__topbar .dk__title')).toHaveText(/Ruoka ja ateriat/);

  // SideMenu is built from lesson phases: 1 teoria + 10 phases + 1 flashcards
  // + 2 tests + 1 itsearvio = 15 rows.
  const rowCount = await page.locator('.dk__sidemenu-list .dk__row').count();
  expect(rowCount).toBe(15);

  // First row is the teoria sivu, active by default.
  await expect(page.locator('.dk__row.is-active')).toHaveAttribute('data-sivu', 'teoria');

  // Teoria sivu renders the markdown: page title (italic em), at least one
  // BilingualTable (ateriat), and an Obs! InfoBox.
  await expect(page.locator('.dk__page-title em')).toContainText('Ruoka ja ateriat');
  await expect(page.locator('.dk__bilingual')).toHaveCount(1);
  await expect(page.locator('.dk__bilingual th').first()).toBeVisible();
  await expect(page.locator('.dk__obs')).toHaveCount(2);
  await expect(page.locator('.dk__obs-label').first()).toHaveText('Obs!');

  // Key points panel renders the teaching.key_points array.
  await expect(page.locator('.dk__key-points')).toBeVisible();

  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr2-teoria.png'),
    fullPage: true,
  });
});

test('Prev/Next walks teoria → phase-0 → phase-1', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.evaluate((h) => { location.hash = h; }, DEMO_HASH);
  await page.waitForTimeout(1200);

  await page.locator('.dk__prevnext--bottom .dk__prevnext-btn--next').click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => location.hash)).toContain('/3/phase-0');

  await page.locator('.dk__prevnext--bottom .dk__prevnext-btn--next').click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => location.hash)).toContain('/3/phase-1');
});

test('SideMenu toggle persists across navigation', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.evaluate((h) => { location.hash = h; }, DEMO_HASH);
  await page.waitForTimeout(1100);

  await page.locator('#dk-toggle-sidemenu').click();
  await page.waitForTimeout(150);
  const collapsed = await page.evaluate(() => document.getElementById('dk-root').dataset.sidemenu);
  expect(collapsed).toBe('collapsed');
  expect(await page.evaluate(() => localStorage.getItem('puheo:dk:sidemenu'))).toBe('collapsed');
});
