// L-V394 — verifies the post-lesson "continue" V0 fix.
// The legacy #screen-path was permanently hidden ("KILL SCREEN-PATH"), yet
// curriculum.js loadCurriculum() still rendered into it, dropping the user on
// a blank surface after finishing a lesson. The fix repoints the post-lesson
// callers (lessonResults.goToPath / goBackToCurriculum, teachingPanel bounce)
// to the live #/oppimispolku route. This spec proves:
//   1. #screen-path is genuinely hidden (the bug premise),
//   2. #/oppimispolku (the new index destination) renders a visible screen,
//   3. #/oppimispolku/{lang}/{key} (the focusKurssiKey destination) renders.
import { test, expect } from '@playwright/test';

const plant = (page) =>
  page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });

const EMAIL = (process.env.TEST_PRO_EMAILS || '').split(',')[0].trim() || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || '';
const LIVE = !!(EMAIL && PASS);

test.describe('L-V394 post-lesson path nav (V0 blank-screen fix)', () => {
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

  test('#screen-path is killed (display:none) — the dead destination', async ({ page }) => {
    const path = page.locator('#screen-path');
    if (await path.count()) {
      // Force-activate it the way the old loadCurriculum() did and assert it
      // stays invisible (the KILL rule wins).
      await page.evaluate(() => document.getElementById('screen-path')?.classList.add('screen', 'active'));
      await expect(path).toBeHidden();
    }
  });

  test('#/oppimispolku renders the live index (not blank)', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#op-root .lp-list', { timeout: 10000 });
    await expect(page.locator('#op-root .lp-list')).toBeVisible();
    // The index screen is the active one — not a blank surface.
    await expect(page.locator('#screen-oppimispolku-index')).toHaveClass(/(^|\s)active(\s|$)/);
  });

  test('#/oppimispolku/es/kurssi_1 renders the live course detail (focusKurssiKey path)', async ({ page }) => {
    await page.goto('/app.html#/oppimispolku/es/kurssi_1');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#cd-root .lesson-list', { timeout: 10000 });
    await expect(page.locator('#cd-root .lesson-list')).toBeVisible();
  });
});
