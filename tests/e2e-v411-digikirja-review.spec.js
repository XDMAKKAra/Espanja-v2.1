// L-V411 Vaihe C (digikirja port) — live browser verification that the review
// phase shows up on the REAL lesson path (digikirja) and that answering it
// flushes adaptive capture. Both network calls are intercepted, so the test does
// not depend on the account's seeded mistakes or the server-side tier gate.
//
// Runs only when TEST_PRO_PASSWORD is set (LIVE), like the other authed specs.

import { test, expect } from '@playwright/test';

const EMAIL = (process.env.TEST_PRO_EMAILS || '').split(',')[0].trim() || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || '';
const LIVE = !!PASS;

// Single canned review item → one answer completes the phase → capture flushes.
const REVIEW_QUEUE = {
  locked: false,
  dueCount: 4,
  concepts: [{ topic: 'subjunctive', count: 6 }],
  items: [
    {
      item_type: 'mc',
      stem: 'Quiero que ella ___ feliz hoy.',
      choices: ['es', 'sea', 'era', 'fue'],
      correct_index: 1,
      explanation: 'Quiero que + subjunktiivi (sea).',
      _concept: 'subjunctive',
    },
  ],
};

test.describe('L-V411 Vaihe C — digikirja review phase + capture (live path)', () => {
  test.skip(!LIVE, 'set TEST_PRO_PASSWORD to run');
  test.use({ viewport: { width: 390, height: 844 } });

  let captureBodies;

  test.beforeEach(async ({ page }) => {
    captureBodies = [];
    await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
    await page.route('**/api/curriculum/review-queue**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REVIEW_QUEUE) }));
    await page.route('**/api/curriculum/capture', (route) => {
      try { captureBodies.push(JSON.parse(route.request().postData() || '{}')); } catch { /* ignore */ }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ captured: true }) });
    });

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

  test('the "Kertaus" review phase is injected as the first exercise page', async ({ page }) => {
    await page.goto('/app.html#/oppitunti/es/kurssi_1/2/teoria');
    await page.waitForLoadState('networkidle');
    // sidemenu lists the injected review phase. On mobile (390px) the book
    // sidemenu is collapsed/hidden, so read its text content directly rather
    // than waiting for visibility.
    await page.waitForSelector('#dk-sidemenu-list', { state: 'attached', timeout: 15000 });
    const sideText = await page.locator('#dk-sidemenu-list').textContent();
    expect(sideText).toContain('Kertaus');
  });

  test('opening the review page renders the canned review item', async ({ page }) => {
    await page.goto('/app.html#/oppitunti/es/kurssi_1/2/phase-0');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#screen-digikirja')).toContainText('Quiero que ella', { timeout: 15000 });
  });

  test('answering the review item flushes adaptive capture with the right concept', async ({ page }) => {
    await page.goto('/app.html#/oppitunti/es/kurssi_1/2/phase-0');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.dk__exercise .dk__choice', { timeout: 15000 });
    // answer the single MC item → phase complete → flushPhaseCapture POSTs
    await page.locator('.dk__exercise .dk__choice').first().click();
    await expect.poll(() => captureBodies.length, { timeout: 10000 }).toBeGreaterThan(0);
    const body = captureBodies[captureBodies.length - 1];
    expect(body.lang).toBe('es');
    expect(Array.isArray(body.gradedItems)).toBe(true);
    expect(body.gradedItems.length).toBeGreaterThan(0);
    expect(body.gradedItems[0].topics).toContain('subjunctive');
  });
});
