// L-V390 — two production bugs on the logged-in Pro account:
//   A) profile menu showed "Päivitä Pro" to a Pro user (the [hidden] attribute
//      was overridden by `.profile-menu__item { display: flex }`, and sync only
//      ran on the dashboard screen, never on HOME).
//   B) Oppimispolku opened the wrong language (stale puheo:lang) and the German
//      course detail showed Spanish completions ("1.1 Suoritettu") because the
//      detail endpoint did not scope progress by language.
//
// Reproduced with a stale puheo:lang="de" planted before login. testpro123 has
// target_language=null and exactly one progress row (es / kurssi_1 / lesson 1).
import { test, expect } from '@playwright/test';

// Plant the gate bypass AND a stale German tab store, mirroring the real device
// state that triggered the bug.
const plant = (page) =>
  page.addInitScript(() => {
    try {
      localStorage.setItem('puheo_gate_ok_v1', '1');
      localStorage.setItem('puheo:lang', 'de');
    } catch {}
  });

const EMAIL = (process.env.TEST_PRO_EMAILS || '').split(',')[0].trim() || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || '';
const LIVE = !!(EMAIL && PASS);

test.describe('L-V390 Pro status + Oppimispolku language/progress', () => {
  test.skip(!LIVE, 'set TEST_PRO_PASSWORD to run');
  test.use({ viewport: { width: 390, height: 844 } });

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
    // Wait for the post-login redirect to settle (auth screen gone) BEFORE the
    // test navigates, otherwise the async loadHome fires after our goto and
    // switches the active screen out from under the assertion (pre-existing
    // race that also affects e2e-app-v388).
    await page.waitForFunction(
      () => !document.getElementById('screen-auth')?.classList.contains('active'),
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('Bug A: Pro user does NOT see "Päivitä Pro" in the profile menu', async ({ page }) => {
    // Open the avatar menu (top-right).
    await page.locator('#profile-menu-btn').click();
    await expect(page.locator('#profile-menu')).toBeVisible();
    // The upgrade item must be hidden for a Pro account.
    await expect(page.locator('#profile-menu-upgrade')).toBeHidden();
  });

  test('Bug B1: Oppimispolku opens the active language (Espanja), not Saksa', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#op-root .op-eyebrow', { timeout: 10000 });
    await expect(page.locator('#op-root .op-eyebrow')).toContainText('Espanja');
    await expect(page.locator('#op-root .op-eyebrow')).not.toContainText('Saksa');
  });

  test('Bug B2: German course detail shows NO Spanish completion bleed', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku/de/kurssi_1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#cd-root .op-row__status', { timeout: 10000 });
    // German has no progress for this user → no lesson row may read "Suoritettu".
    const statuses = await page.locator('#cd-root .op-row__status').allTextContents();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.some((s) => /Suoritettu/i.test(s))).toBe(false);
  });

  test('Bug B3: Spanish kurssi_1 still shows the real completion', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku/es/kurssi_1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#cd-root .op-row__status', { timeout: 10000 });
    const statuses = await page.locator('#cd-root .op-row__status').allTextContents();
    // Lesson 1 was completed in es → at least one "Suoritettu".
    expect(statuses.some((s) => /Suoritettu/i.test(s))).toBe(true);
  });
});
