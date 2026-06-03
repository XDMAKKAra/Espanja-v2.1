// L-V379 — lesson (digikirja) writing task: max points shown up front,
// character counter (not word counter), no YTL grade letter on normal tasks.
// Verifies the COMPOSER state without spending an OpenAI grade. The grade
// removal in the result view is a pure conditional on isYo; the composer
// covers the visible-before-writing requirements (points + merkkiä).
import { test, expect } from '@playwright/test';

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

// A writing-type lesson: phase-0 is a writing_long composer (buildSivut maps
// each phase to id `phase-{i}`).
const WRITING_HASH = '#/oppitunti/de/kurssi_3/10/phase-0';

test('lesson writing composer shows max points + character counter, no word target', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);

  await page.evaluate((h) => { location.hash = h; }, WRITING_HASH);
  await page.waitForTimeout(1800);

  const writing = page.locator('.dk__writing').first();
  await expect(writing).toBeVisible();

  // 1. Max points visible up front (0 / 20 p), in the header.
  await expect(writing.locator('.dk__exercise-score')).toHaveText(/0\s*\/\s*20\s*p/);

  // 2. Character counter, not a word counter.
  await expect(writing.locator('.dk__writing-counter')).toContainText('merkkiä');
  await expect(writing.locator('.dk__writing-counter')).not.toContainText('sanaa');
  await expect(writing.locator('#dk-writing-chars')).toBeVisible();

  // Counter updates by character as the student types.
  const ta = writing.locator('#dk-writing-input');
  await ta.fill('Hallo, ich heisse Anna.');
  await page.waitForTimeout(200);
  await expect(writing.locator('#dk-writing-chars')).toHaveText('23');

  // 3. Eyebrow reads as a normal lesson writing task (not YO).
  await expect(writing.locator('.dk__exercise-eyebrow')).toHaveText('Kirjoitustehtävä');
});
