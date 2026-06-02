// L-V355 — mobile landing menu (hamburger → full-screen overlay).
// Covers: visibility ≤720px / hidden on desktop, open/close, section
// links navigate + close, state-aware primary button (logged out vs in),
// Esc + backdrop close, body scroll lock, no horizontal scroll, focus.
import { test, expect } from '@playwright/test';

const gate = async (page) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
};

test.describe('landing mobile menu — logged out (390px)', () => {
  test.beforeEach(async ({ page }) => {
    await gate(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('hamburger visible, desktop CTAs hidden', async ({ page }) => {
    await expect(page.locator('#nav-hamburger')).toBeVisible();
    await expect(page.locator('#nav-cta')).toBeHidden();
    await expect(page.locator('#nav-menu')).toBeHidden();
  });

  test('opens, closes via X, aria-expanded tracks state', async ({ page }) => {
    const burger = page.locator('#nav-hamburger');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await burger.click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#nav-menu-close').click();
    await expect(page.locator('#nav-menu')).toBeHidden();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });

  test('state-aware button: Aloita + Kirjaudu when logged out', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    const signup = page.locator('#nav-menu-signup');
    await expect(signup).toBeVisible();
    await expect(signup).toHaveText(/Aloita/);
    await expect(signup).toHaveAttribute('href', '/app.html#rekisteroidy');
    await expect(page.locator('#nav-menu-login')).toBeVisible();
    await expect(page.locator('#nav-menu-chip')).toBeHidden();
  });

  test('all four section links navigate to anchor and close menu', async ({ page }) => {
    const links = [
      ['Kurssit', 'kurssit'],
      ['Näyte', 'nayte'],
      ['Hinnoittelu', 'hinnoittelu'],
      ['FAQ', 'faq'],
    ];
    for (const [label, anchor] of links) {
      await page.locator('#nav-hamburger').click();
      await expect(page.locator('#nav-menu')).toBeVisible();
      await page.locator('.nav-menu__link', { hasText: new RegExp(`^${label}$`) }).click();
      await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
      await expect(page.locator('#nav-menu')).toBeHidden();
    }
  });

  test('Esc closes', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-menu')).toBeHidden();
  });

  test('backdrop tap closes', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    // click near the bottom of the overlay, below the content panel
    await page.locator('#nav-menu').click({ position: { x: 195, y: 800 } });
    await expect(page.locator('#nav-menu')).toBeHidden();
  });

  test('body scroll locked while open, restored on close', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.locator('#nav-menu-close').click();
    await expect(page.locator('#nav-menu')).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('no horizontal scroll with menu open', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('focus moves into menu on open, back to hamburger on close', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    await expect(page.locator('#nav-menu-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-hamburger')).toBeFocused();
  });
});

test.describe('landing mobile menu — logged in (390px)', () => {
  test.beforeEach(async ({ page }) => {
    await gate(page);
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_token', 'test-token'); } catch {}
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('state-aware button: Jatka harjoittelua → /app.html', async ({ page }) => {
    await page.locator('#nav-hamburger').click();
    const chip = page.locator('#nav-menu-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText(/Jatka harjoittelua/);
    await expect(chip).toHaveAttribute('href', '/app.html');
    await expect(page.locator('#nav-menu-signup')).toBeHidden();
    await expect(page.locator('#nav-menu-login')).toBeHidden();
  });
});

test.describe('landing mobile menu — desktop (1440px)', () => {
  test('hamburger hidden, menu absent, nav CTAs present', async ({ page }) => {
    await gate(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#nav-hamburger')).toBeHidden();
    await expect(page.locator('#nav-menu')).toBeHidden();
    await expect(page.locator('#nav-cta')).toBeVisible();
    await expect(page.locator('.nav__links')).toBeVisible();
  });
});
