import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
});

test('proof section verify', async ({ page }, testInfo) => {
  const tag = testInfo.project.name;
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // no horizontal overflow
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  const iw = await page.evaluate(() => window.innerWidth);
  console.log(`[${tag}] overflow=${sw > iw} (sw=${sw} iw=${iw})`);
  expect(sw).toBeLessThanOrEqual(iw + 1);

  // no uppercase leakage on grader labels
  const upper = await page.evaluate(() => {
    const sels = ['.grader-card[data-lang="es"] .grader-card__title',
                  '.grader-card[data-lang="es"] .rubric-total__label',
                  '.grader-card[data-lang="es"] .grader-card__badge'];
    return sels.map(s => { const el = document.querySelector(s); return el ? getComputedStyle(el).textTransform : 'MISSING'; });
  });
  console.log(`[${tag}] textTransforms`, JSON.stringify(upper));
  upper.forEach(t => expect(t).toBe('none'));

  // feedback present for all 3 langs
  const fb = await page.evaluate(() => {
    return ['es', 'fr', 'de'].map(l => {
      const el = document.querySelector(`.grader-card[data-lang="${l}"] .grader-feedback__body`);
      return el ? el.textContent.trim().length : 0;
    });
  });
  console.log(`[${tag}] feedback lengths`, JSON.stringify(fb));
  fb.forEach(n => expect(n).toBeGreaterThan(80));

  // two-column on desktop, single on mobile
  const cols = await page.evaluate(() => {
    const el = document.querySelector('.grader-card[data-lang="es"] .grader-card__cols');
    return getComputedStyle(el).gridTemplateColumns;
  });
  console.log(`[${tag}] grid-cols=${cols}`);

  // scroll-padding-top set
  const spt = await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop);
  console.log(`[${tag}] scroll-padding-top=${spt}`);

  // screenshot the proof card (clip-safe at dsf 1 for mobile project would still be tall; use element shot)
  const card = page.locator('.grader-card[data-lang="es"]');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await card.screenshot({ path: `tests/_v348-card-${tag}.png` });
});
