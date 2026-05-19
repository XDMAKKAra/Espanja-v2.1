// PR1 smoke: Otava Fokus 7 three-panel digikirja screen.
// Verifies the new screen mounts, the SideMenu lists all sivut for
// the demo lesson, clicking a row switches the content, and the
// SideMenu toggle persists across navigation.
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

test('digikirja shell renders with demo lesson and switches sivu', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Navigate directly to the new 5-segment route.
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi-2/3/teoria'; });
  await page.waitForTimeout(800);

  // Active screen must be screen-digikirja.
  const active = await page.evaluate(() => document.querySelector('.screen.active')?.id);
  expect(active).toBe('screen-digikirja');

  // TopBar, SideMenu list, content present.
  await expect(page.locator('.dk__topbar')).toBeVisible();
  await expect(page.locator('.dk__sidemenu')).toBeVisible();
  await expect(page.locator('.dk__content')).toBeVisible();

  // SideMenu list has the full set of demo sivut (9 rows).
  const rowCount = await page.locator('.dk__sidemenu-list .dk__row').count();
  expect(rowCount).toBe(9);

  // Default active row is teoria.
  await expect(page.locator('.dk__row.is-active')).toHaveAttribute('data-sivu', 'teoria');

  // Click sivu "2a" and verify the active row + URL update.
  await page.locator('.dk__row[data-sivu="2a"]').click();
  await page.waitForTimeout(200);
  await expect(page.locator('.dk__row.is-active')).toHaveAttribute('data-sivu', '2a');
  expect(await page.evaluate(() => location.hash)).toContain('/3/2a');

  // Content title reflects sivu 2a.
  const title = await page.locator('.dk__page-title').first().textContent();
  expect(title).toContain('Yhdistä');

  // Toggle SideMenu collapse on desktop and verify the dataset flag.
  await page.locator('#dk-toggle-sidemenu').click();
  await page.waitForTimeout(200);
  const collapsed = await page.evaluate(() => document.getElementById('dk-root').dataset.sidemenu);
  expect(collapsed).toBe('collapsed');
  expect(await page.evaluate(() => localStorage.getItem('puheo:dk:sidemenu'))).toBe('collapsed');

  // Screenshot for visual verification.
  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr1-desktop.png'),
    fullPage: true,
  });
});

test('Prev/Next buttons walk through sivut', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi-2/3/teoria'; });
  await page.waitForTimeout(700);

  // Click bottom Next button → moves to sivu 1.
  await page.locator('.dk__prevnext--bottom .dk__prevnext-btn--next').click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => location.hash)).toContain('/3/1');

  // Click bottom Next again → moves to sivu 2a.
  await page.locator('.dk__prevnext--bottom .dk__prevnext-btn--next').click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => location.hash)).toContain('/3/2a');
});
