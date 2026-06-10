import { test, expect } from '@playwright/test';

// L-V412 — landing v2 production port QA.
// Acceptance: no horizontal scroll at 360/390/1440 on all five pages,
// purchase CTA above the fold on the mobile homepage, and the language
// switcher works on the pages that have one.

const PAGES = [
  { path: '/', name: 'etusivu' },
  { path: '/nayte', name: 'nayte' },
  { path: '/espanjan-abikurssi', name: 'espanjan-abikurssi' },
  { path: '/ranskan-abikurssi', name: 'ranskan-abikurssi' },
  { path: '/saksan-abikurssi', name: 'saksan-abikurssi' },
];
const WIDTHS = [360, 390, 1440];

test.beforeEach(async ({ page }) => {
  // Bypass the pre-launch password gate before any navigation.
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
});

for (const { path, name } of PAGES) {
  for (const w of WIDTHS) {
    test(`no horizontal scroll: ${name} @ ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto(path, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(
        overflow.scrollW,
        `${name} @ ${w}px overflowed: scrollW=${overflow.scrollW} clientW=${overflow.clientW}`
      ).toBeLessThanOrEqual(overflow.clientW + 1);
    });
  }
}

test('etusivu: osto-CTA above fold @ 390x664', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const btn = page.locator('.hero .btn-primary');
  await expect(btn).toBeVisible();
  const box = await btn.boundingBox();
  expect(box, 'hero CTA has no box').not.toBeNull();
  const bottom = box.y + box.height;
  expect(bottom, `hero CTA bottom ${bottom} not above 664 fold`).toBeLessThanOrEqual(664);
});

test('etusivu: kielivaihto vaihtaa otsikon ja paperin', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.hl')).toHaveText('espanjan');
  await expect(page.locator('.paper[data-paper="es"]')).toBeVisible();

  await page.locator('.seg-btn[data-lang="fr"]').click();
  await expect(page.locator('.hl')).toHaveText('ranskan');
  await expect(page.locator('.paper[data-paper="fr"]')).toBeVisible();
  await expect(page.locator('.paper[data-paper="es"]')).toBeHidden();
  await expect(page.locator('.seg-btn[data-lang="fr"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('.seg-btn[data-lang="de"]').click();
  await expect(page.locator('.hl')).toHaveText('saksan');
  await expect(page.locator('.paper[data-paper="de"]')).toBeVisible();
});

test('nayte: kielivaihto vaihtaa paperin', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/nayte', { waitUntil: 'networkidle' });
  await expect(page.locator('.paper[data-paper="es"]')).toBeVisible();
  await page.locator('.seg-btn[data-lang="de"]').click();
  await expect(page.locator('.paper[data-paper="de"]')).toBeVisible();
  await expect(page.locator('.paper[data-paper="es"]')).toBeHidden();
});

test('mobiili: hampurilainen avaa overlay-valikon abikurssilinkkeineen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#nav-burger')).toBeVisible();
  await expect(page.locator('.nav-menu')).toBeHidden();
  await page.locator('#nav-burger').click();
  const overlay = page.locator('#nav-overlay');
  await expect(overlay).toBeVisible();
  // overlay must cover the screen (regression: nav backdrop-filter clipped it to ~68px)
  const box = await overlay.boundingBox();
  expect(box.height, `overlay height ${box.height} too small (clipped?)`).toBeGreaterThan(400);
  for (const href of ['/espanjan-abikurssi', '/ranskan-abikurssi', '/saksan-abikurssi', '/artikkelit/', '/pricing.html', '/ukk']) {
    await expect(overlay.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});

test('desktop: päävalikko näkyy, hampurilainen piilossa', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.nav-menu')).toBeVisible();
  await expect(page.locator('#nav-burger')).toBeHidden();
  for (const href of ['/espanjan-abikurssi', '/ranskan-abikurssi', '/saksan-abikurssi']) {
    await expect(page.locator(`.nav-dd-menu a[href="${href}"]`)).toHaveCount(1);
  }
});

test('pisteet ovat 0-33 skaalalla, ei vanhaa 62-71', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const stamp = page.locator('.paper[data-paper="es"] .stamp-range');
  await expect(stamp).toHaveText('21–27');
  await expect(page.locator('.paper[data-paper="es"] .stamp-max')).toContainText('33');
  const body = await page.content();
  expect(body).not.toContain('62-71');
});
