// Ship 1.5 verification — Old-Spain illustrated landing renders, key
// sections present, multi-language coverage visible, and the AI-slop
// patterns from Ship 1 are not present.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
});

test('Ship 1.5 — Old-Spain landing renders with multi-language hero', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Full-page screenshot only on desktop — mobile retina exceeds 32767px limit.
  const vp = page.viewportSize();
  if (vp && vp.width >= 1024) {
    await page.screenshot({ path: path.join(OUT_DIR, 'ship1_5-landing-full.png'), fullPage: true });
  }

  // Hero title covers all three languages — must NOT be Spanish-only
  const heroTitle = page.locator('#hero-title');
  await expect(heroTitle).toBeVisible();
  const titleText = await heroTitle.textContent();
  expect(titleText).toMatch(/lyhyen kielen YO-koe/i);
  expect(titleText).toMatch(/kirjoituskoe/i);
  // Must NOT say "Espanjan YO-koe" (Ship 1's mistake)
  expect(titleText.toLowerCase()).not.toContain('espanjan yo-koe');

  // Three language pills visible in hero
  await expect(page.locator('.hero__lang-pill[lang="es"]')).toBeVisible();
  await expect(page.locator('.hero__lang-pill[lang="fr"]')).toBeVisible();
  await expect(page.locator('.hero__lang-pill[lang="de"]')).toBeVisible();

  // Hero illustration present (not stock photo, not grader card)
  await expect(page.locator('.hero__illustration')).toBeVisible();
  const illSrc = await page.locator('.hero__illustration').getAttribute('src');
  expect(illSrc).toMatch(/illustrations/);

  // Countdown pill present (eyebrow micro-pill, NOT a 720px standalone card)
  await expect(page.locator('.hero__eyebrow.yo-countdown')).toBeVisible();

  // Stat row — verifiable numbers (4 stats)
  await expect(page.locator('.stat')).toHaveCount(4);
  await expect(page.locator('.stat__num').first()).toBeVisible();
  // No disputable percentages
  const statText = await page.locator('.stat-row').textContent();
  expect(statText).not.toMatch(/\d+\s*%/);

  // Course catalog: 8 cards, language switcher
  await expect(page.locator('.catalog-card')).toHaveCount(8);
  await expect(page.locator('.catalog__lang-switch button[data-lang="es"]')).toBeVisible();
  await expect(page.locator('.catalog__lang-switch button[data-lang="fr"]')).toBeVisible();
  await expect(page.locator('.catalog__lang-switch button[data-lang="de"]')).toBeVisible();

  // Switch to French and verify card title changes
  await page.locator('.catalog__lang-switch button[data-lang="fr"]').click();
  await page.waitForTimeout(150);
  const firstCardFr = await page.locator('.catalog-card__title').first().textContent();
  expect(firstCardFr.toLowerCase()).toContain('salutations');

  // Grader card moved to dedicated proof section, not in hero
  const heroBox = await page.locator('.hero').boundingBox();
  const graderBox = await page.locator('.grader-card').boundingBox();
  expect(graderBox.y).toBeGreaterThan(heroBox.y + heroBox.height - 1);

  // Testimonials — asymmetric (lead + 2 fragments), one per language
  await expect(page.locator('.testimonial--lead')).toHaveCount(1);
  await expect(page.locator('.testimonial--frag')).toHaveCount(2);
  // Multi-language coverage in roles
  await expect(page.locator('.testimonial__role', { hasText: /espanja/i })).toBeVisible();
  await expect(page.locator('.testimonial__role', { hasText: /ranska/i })).toBeVisible();
  await expect(page.locator('.testimonial__role', { hasText: /saksa/i })).toBeVisible();
  // No specific lukio names (Ship 1's mistake) — these were the rejected ones
  const testimonialsText = await page.locator('.testimoniaalit').textContent();
  expect(testimonialsText).not.toContain('Mäkelänrinteen');
  expect(testimonialsText).not.toContain('Etelä-Tapiolan');
  expect(testimonialsText).not.toContain('Tampereen Lyseon');

  // Pricing table (not card grid)
  await expect(page.locator('table.pricing-table')).toBeVisible();
  await expect(page.locator('.pricing-table thead th', { hasText: 'Free' })).toBeVisible();
  await expect(page.locator('.pricing-table thead th', { hasText: 'Treeni' })).toBeVisible();
  await expect(page.locator('.pricing-table thead th', { hasText: 'Mestari' })).toBeVisible();
  // Multi-language row in pricing
  await expect(page.locator('.pricing-table td', { hasText: /kolme kieltä/i })).toBeVisible();

  // FAQ — Mafy-comparison preserved (Ship 1 got this right)
  await expect(page.locator('.faq-item__q-text', { hasText: 'Mafy' })).toBeVisible();

  // Old-Spain palette — cream body bg (not white, not dark)
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const m = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    expect(r, 'body bg R warm cream').toBeGreaterThan(230);
    expect(g, 'body bg G warm cream').toBeGreaterThan(225);
    expect(b, 'body bg B warm cream').toBeGreaterThan(210);
    // Cream not pure white
    expect(r + g + b).toBeLessThan(255 * 3);
  }

  // Display font — Fraunces (not Source Serif 4, not Inter)
  const heroFont = await page.evaluate(() => {
    const h = document.getElementById('hero-title');
    return h ? getComputedStyle(h).fontFamily : '';
  });
  // Fraunces must be the FIRST family (not a fallback)
  expect(heroFont.trim().split(',')[0]).toMatch(/Fraunces/i);

  // Body font — Manrope (not Inter, not Geist)
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(bodyFont).toMatch(/Manrope/i);
  expect(bodyFont).not.toMatch(/^Inter/i);
});

test('Ship 1.5 — accessibility skeleton', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Skip link present and focusable (DOM-first, before any other landmark)
  const skipLink = page.locator('.skip-link');
  await expect(skipLink).toHaveCount(1);
  await skipLink.focus();
  const focusedClass = await page.evaluate(() => document.activeElement?.className || '');
  expect(focusedClass).toContain('skip-link');

  // All h1 = one only
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // Language switcher uses role=tab + aria-pressed
  const tabs = page.locator('.catalog__lang-switch [role="tab"]');
  await expect(tabs).toHaveCount(3);
});
