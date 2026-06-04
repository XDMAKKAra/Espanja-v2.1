// L-V387 — hero lifted to the Claude Design kit: warm cream canvas (no pure
// white surfaces), course card with a single "Aloita nyt" CTA (no Treeni line),
// a social-proof block under the hero (stars + teacher quote + YTL badge), and
// the card stacked last on mobile. Also fixes the broken /artikkelit top bar.
import { test, expect } from '@playwright/test';

const gate = async (page) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
};

test.describe('L-V387 hero polish', () => {
  test.beforeEach(async ({ page }) => { await gate(page); });

  test('social-proof block: stars, teacher quote, YTL badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const social = page.locator('.hero__social');
    await expect(social).toBeVisible();
    await expect(social.locator('.hero__stars')).toHaveAttribute('aria-label', /8,9/);
    await expect(social.locator('.hero__rating-score')).toContainText('8,9');
    await expect(social.locator('.hero__quote-text')).toContainText('abikirjoitelman');
    await expect(social.locator('.hero__quote-author')).toContainText('kieltenopettaja');
    await expect(social.locator('.hero__badge')).toContainText('YTL');
  });

  test('course card: single "Aloita nyt" CTA, no Treeni line, "Mitä sisältyy" label', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const card = page.locator('#hero-offer');
    await expect(card.locator('.offer-card__cta')).toHaveText(/Aloita nyt/);
    await expect(card.locator('.offer-card__cta')).toHaveAttribute('href', '/app.html#rekisteroidy');
    await expect(card.locator('.offer-card__incl-label')).toHaveText('Mitä sisältyy');
    // Treeni promo + old "Valitse kurssi" CTA are gone from the card.
    const cardText = (await card.textContent()) || '';
    expect(cardText).not.toContain('Treeni 9');
    expect(cardText).not.toContain('Valitse kurssi');
    await expect(card.locator('.offer-card__price')).toContainText('49');
  });

  test('ES/FR/DE tabs still swap the card context', async ({ page }) => {
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

  test('warm canvas: card surface is not pure white', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    const cardBg = await page.locator('.offer-card').evaluate(
      (el) => getComputedStyle(el).backgroundColor);
    expect(cardBg).not.toBe('rgb(255, 255, 255)');
  });

  test('mobile: course card stacks below the social block', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const social = await page.locator('.hero__social').boundingBox();
    const offer = await page.locator('.hero__offer').boundingBox();
    expect(social).not.toBeNull();
    expect(offer).not.toBeNull();
    // Card comes after the trust block on mobile.
    expect(offer.y).toBeGreaterThan(social.y);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe('L-V387 /artikkelit top bar', () => {
  test.beforeEach(async ({ page }) => { await gate(page); });

  test('shared nav: editorial CSS applied, menu closed, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/artikkelit/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // The mobile overlay is closed on load (hidden attribute respected).
    await expect(page.locator('#nav-menu')).toBeHidden();
    // Hamburger is the visible trigger on mobile (nav links hidden by editorial CSS).
    await expect(page.locator('#nav-hamburger')).toBeVisible();
    // The desktop Kurssit dropdown menu is collapsed, not spilled open inline —
    // proves landing-editorial nav CSS is loaded (absolute + opacity:0 until
    // hover). Before the fix it had no positioning and rendered open inline.
    const dd = await page.locator('#nav-kurssit-menu').evaluate((el) => {
      const s = getComputedStyle(el);
      return { opacity: s.opacity, position: s.position };
    });
    expect(dd.opacity).toBe('0');
    expect(dd.position).toBe('absolute');

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    // Article content is intact.
    await expect(page.locator('h1')).toBeVisible();
  });

  test('hamburger opens and closes the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/artikkelit/');
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.locator('#nav-hamburger').click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    await page.locator('#nav-menu-close').click();
    await expect(page.locator('#nav-menu')).toBeHidden();
  });
});
