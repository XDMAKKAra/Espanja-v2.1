// Ship 1 verification — editorial-textbook landing renders and key
// elements are present. Snapshot for manual inspection in audit-screens/.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('landing — editorial register loaded, key sections present', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Snapshot
  await page.screenshot({ path: path.join(OUT_DIR, 'ship1-landing-full.png'), fullPage: true });

  // Hero present with new title
  const heroTitle = page.locator('#hero-title');
  await expect(heroTitle).toBeVisible();
  await expect(heroTitle).toContainText('kirjoituskoe');

  // Grader card still present (re-used markup)
  await expect(page.locator('.grader-card').first()).toBeVisible();

  // Testimoniaalit — full names visible
  await expect(page.locator('.testimonial__name', { hasText: 'Aino Mäkelä' })).toBeVisible();
  await expect(page.locator('.testimonial__name', { hasText: 'Niko Virtanen' })).toBeVisible();
  await expect(page.locator('.testimonial__name', { hasText: 'Olivia Saarinen' })).toBeVisible();
  // grade shift visible
  await expect(page.locator('.testimonial__shift').first()).toBeVisible();

  // "Mitä saat" section with roman numerals (3 items)
  await expect(page.locator('.wyg-item__num')).toHaveCount(3);
  await expect(page.locator('.wyg-item__num').first()).toHaveText('I.');

  // Pricing table (not card grid)
  await expect(page.locator('table.pricing-table')).toBeVisible();
  await expect(page.locator('.pricing-table thead th', { hasText: 'Free' })).toBeVisible();
  await expect(page.locator('.pricing-table thead th', { hasText: 'Treeni' })).toBeVisible();
  await expect(page.locator('.pricing-table thead th', { hasText: 'Mestari' })).toBeVisible();

  // FAQ comparison question added
  await expect(page.locator('.faq-item__q-text', { hasText: 'Mafy' })).toBeVisible();

  // Editorial register actually applied (paper background)
  const bodyBg = await page.evaluate(() => {
    return getComputedStyle(document.body).backgroundColor;
  });
  // Paper-tinted color: should NOT be dark (rgb values all > 200)
  const m = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    expect(r, `body bg R=${r} expected paper-light`).toBeGreaterThan(200);
    expect(g, `body bg G=${g} expected paper-light`).toBeGreaterThan(200);
    expect(b, `body bg B=${b} expected paper-light`).toBeGreaterThan(180);
  } else {
    // colors may be oklch() in some browsers; ensure at least not dark
    expect(bodyBg).not.toMatch(/rgb\(0,/);
  }
});
