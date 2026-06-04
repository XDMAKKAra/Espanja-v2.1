// L-V385 — hero rebuilt to Lara structure: course/price card in the right
// column, no product demo screenshot on the landing, ES/FR/DE tabs swap the
// card context (price stays one product across languages). Demo lives at
// /nayte, reachable from the hero secondary link.
import { test, expect } from '@playwright/test';

test.describe('L-V385 hero course card', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
    });
  });

  test('hero shows the course card and no demo screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const card = page.locator('#hero-offer');
    await expect(card).toBeVisible();
    await expect(card.locator('.offer-card__price')).toContainText('49');

    // The old product screenshot is gone from the hero.
    await expect(page.locator('#hero-shot')).toHaveCount(0);

    // The demo is still one click away via the hero secondary link.
    await expect(page.locator('.hero .hero__link-secondary[href="/nayte"]')).toBeVisible();

    // No "exact same accuracy as an examiner" claim (L-V354 guard).
    const body = (await page.locator('main').textContent()) || '';
    expect(body.toLowerCase()).not.toContain('sama tarkkuus');
  });

  test('ES/FR/DE tabs swap the card context', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const ctx = page.locator('[data-offer-context]');
    await page.locator('.offer-card__tab[data-lang="fr"]').click();
    await expect(ctx).toContainText('Ranskan');
    await page.locator('.offer-card__tab[data-lang="de"]').click();
    await expect(ctx).toContainText('Saksan');
    await page.locator('.offer-card__tab[data-lang="es"]').click();
    await expect(ctx).toContainText('Espanjan');
  });

  test('no horizontal scroll at 390px with the card stacked', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
