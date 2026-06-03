// L-V383 — pricing.html cleanup: brought onto the same shell as /nayte + /ukk
// (full editorial + spark stack, working hamburger + mobile menu, standard
// footer). Dropped the bespoke dark-theme <style>: no gradient-text h1, no
// near-black-on-brick CTA, theme-color is brick. Tiers reuse .pricing-tier.
import { test, expect } from '@playwright/test';

test.describe('L-V383 pricing cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
    });
  });

  test('renders on the shared shell with a real h1 and both tiers', async ({ page }) => {
    const res = await page.goto('/pricing.html');
    expect(res.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.locator('h1.pricing__title')).toBeVisible();
    await expect(page.locator('.pricing-tier')).toHaveCount(2);
    await expect(page.locator('.compare-table')).toBeVisible();
    // The hamburger + mobile menu now exist (they were missing before).
    await expect(page.locator('#nav-hamburger')).toHaveCount(1);
    await expect(page.locator('#nav-menu')).toHaveCount(1);
    // theme-color is the brand brick, not the old dark value.
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#9B2D2A');
  });

  test('mobile nav works: hamburger opens the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pricing.html');
    await page.waitForLoadState('networkidle').catch(() => {});
    // Desktop links are hidden; the hamburger is the only nav affordance.
    const burger = page.locator('#nav-hamburger');
    await expect(burger).toBeVisible();
    await burger.click();
    await expect(page.locator('#nav-menu')).toBeVisible();
    await expect(page.locator('.nav-menu__link[href="/nayte"]')).toBeVisible();
  });

  test('no slop: no gradient-text clip, no #0B0E0D dark leftovers', async ({ page }) => {
    await page.goto('/pricing.html');
    const html = await page.content();
    expect(html).not.toContain('background-clip: text');
    expect(html).not.toContain('#0B0E0D');
    expect(html).not.toContain('/#tuote');
  });

  test('no horizontal scroll at 390px; links resolve (no 404)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pricing.html');
    await page.waitForLoadState('networkidle').catch(() => {});
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const links = await page.evaluate(() => {
      const origin = location.origin;
      const out = new Set();
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#') || href.startsWith('mailto:')) return;
        let u; try { u = new URL(href, origin); } catch { return; }
        if (u.origin !== origin || u.pathname.startsWith('/app.html')) return;
        out.add(u.pathname);
      });
      return [...out];
    });
    const bad = [];
    for (const p of links) {
      const r = await page.request.get(p, { maxRedirects: 5 });
      if (r.status() >= 400) bad.push(`${p} → ${r.status()}`);
    }
    expect(bad, `404s: ${bad.join(', ')}`).toEqual([]);
  });

  test('screenshots 1440 + 390', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/pricing.html');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/v383-pricing-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pricing.html');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/v383-pricing-mobile.png', fullPage: true });
  });
});
