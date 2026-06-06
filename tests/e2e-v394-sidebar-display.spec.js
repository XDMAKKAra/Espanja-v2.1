// L-V394 sidebar — invariant guard for the !important consolidation.
// The sidebar's resolved `display` per render-state is the behavior contract.
// This spec pins it in all 5 states; run BEFORE and AFTER the cascade change
// to prove zero behavior drift. Expected values (current correct behavior):
//   desktop logged-in        → grid   (sidebar-shell three-row layout)
//   mobile  logged-in closed → flex   (off-canvas drawer, transformed off-screen)
//   mobile  logged-in open   → flex   (drawer slid in)
//   auth    desktop          → none   (login screen, no sidebar — L-V378 leak guard)
//   auth    mobile           → none   (login screen, no sidebar)
import { test, expect } from '@playwright/test';

const plant = (page) =>
  page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });

const EMAIL = (process.env.TEST_PRO_EMAILS || '').split(',')[0].trim() || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || '';
const LIVE = !!(EMAIL && PASS);

async function login(page) {
  await page.locator('#tab-login').click();
  await page.locator('#auth-email').fill(EMAIL);
  await page.locator('#auth-password').fill(PASS);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/') && r.request().method() === 'POST', { timeout: 20000 }),
    page.locator('#btn-auth-submit').click(),
  ]);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () => !document.getElementById('screen-auth')?.classList.contains('active'),
    { timeout: 15000 },
  ).catch(() => {});
}

const displayOf = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.app-sidebar');
    return el ? getComputedStyle(el).display : 'MISSING';
  });

test.describe('L-V394 sidebar display invariant', () => {
  test.skip(!LIVE, 'set TEST_PRO_PASSWORD to run');

  test('desktop logged-in → grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await plant(page);
    await page.goto('/app.html');
    await login(page);
    await page.goto('/app.html#/koti');
    await page.waitForLoadState('networkidle');
    expect(await displayOf(page)).toBe('grid');
    await page.screenshot({ path: 'screenshots/v394-sidebar-desktop-loggedin.png' });
  });

  test('mobile logged-in (closed + open) → flex', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await plant(page);
    await page.goto('/app.html');
    await login(page);
    await page.goto('/app.html#/koti');
    await page.waitForLoadState('networkidle');
    expect(await displayOf(page)).toBe('flex'); // closed: present but transformed off-screen
    await page.screenshot({ path: 'screenshots/v394-sidebar-mobile-closed.png' });
    // Open the drawer.
    const toggle = page.locator('#menu-toggle');
    if (await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(350);
      expect(await displayOf(page)).toBe('flex');
      await page.screenshot({ path: 'screenshots/v394-sidebar-mobile-open.png' });
    }
  });

  test('auth screen (desktop + mobile) → none [L-V378 leak guard]', async ({ page }) => {
    // Desktop, not logged in → login screen, no sidebar.
    await page.setViewportSize({ width: 1440, height: 900 });
    await plant(page);
    await page.goto('/app.html');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.body.classList.contains('auth-mode'), { timeout: 10000 }).catch(() => {});
    expect(await page.evaluate(() => document.body.classList.contains('auth-mode'))).toBe(true);
    expect(await displayOf(page)).toBe('none');
    await page.screenshot({ path: 'screenshots/v394-sidebar-auth-desktop.png' });
    // Mobile auth.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    expect(await displayOf(page)).toBe('none');
    await page.screenshot({ path: 'screenshots/v394-sidebar-auth-mobile.png' });
  });
});
