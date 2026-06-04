// L-V391 — Oppimispolku + Kurssi screens are now a pixel-copy of the export
// (docs/design-ref/app-export). V388 invented its own editorial styling; this
// verifies the export's .lp-* / .cd-* / .lesson-* structure is in place:
//   - the path illustration is the export's thin winding SVG (.lp-illu), not
//     the invented yellow box
//   - locked rows carry a lock icon + "Avautuu vuorollaan"
//   - the active row has a brick pill, the course-detail bar is the green
//     .cd-progress bar
//   - the old invented .op-row / .op-head__art markup is gone
import { test, expect } from '@playwright/test';

const plant = (page) =>
  page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });

const EMAIL = (process.env.TEST_PRO_EMAILS || '').split(',')[0].trim() || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || '';
const LIVE = !!(EMAIL && PASS);

test.describe('L-V391 oppimispolku + kurssi pixel-copy', () => {
  test.skip(!LIVE, 'set TEST_PRO_PASSWORD to run');

  test.beforeEach(async ({ page }) => {
    await plant(page);
    await page.goto('/app.html');
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
  });

  test('oppimispolku: export .lp-* structure, real SVG illu, lock icon', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#op-root .lp-list', { timeout: 10000 });

    // Path illustration must be the export's thin SVG, not an <img> box.
    const illu = page.locator('#op-root .lp-illu');
    await expect(illu).toHaveCount(1);
    expect(await illu.evaluate((el) => el.tagName.toLowerCase())).toBe('svg');
    // The invented yellow box / path-journey art is gone.
    await expect(page.locator('#op-root .op-head__art')).toHaveCount(0);
    await expect(page.locator('#op-root .op-row')).toHaveCount(0);

    // Active row carries a brick pill; locked rows carry a lock icon.
    await expect(page.locator('#op-root .lp-row--active .pill')).toHaveCount(1);
    const locked = page.locator('#op-root .lp-row--locked');
    expect(await locked.count()).toBeGreaterThan(0);
    await expect(locked.first().locator('.lp-row__lock svg.lucide')).toHaveCount(1);
    await expect(locked.first()).toContainText('Avautuu vuorollaan');

    await page.screenshot({ path: 'screenshots/v391-oppimispolku-desktop.png', fullPage: true });
  });

  test('kurssi: export .cd-* + .lesson-* structure, green progress bar', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku/es/kurssi_1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#cd-root .lesson-list', { timeout: 10000 });

    await expect(page.locator('#cd-root .cd-head h1')).toBeVisible();
    // Green progress bar fill present.
    await expect(page.locator('#cd-root .cd-progress .bar > span')).toHaveCount(1);
    // Lessons render; the completed es lesson 1 shows the green done label.
    expect(await page.locator('#cd-root .lesson-row').count()).toBeGreaterThan(0);
    await expect(page.locator('#cd-root .lesson-done').first()).toContainText('Suoritettu');
    // No invented op-row markup.
    await expect(page.locator('#cd-root .op-row')).toHaveCount(0);

    await page.screenshot({ path: 'screenshots/v391-kurssi-desktop.png', fullPage: true });
  });
});
