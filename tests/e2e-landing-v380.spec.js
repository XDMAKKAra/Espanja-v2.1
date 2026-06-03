// L-V380 — landing trim: zig-zag feature wall removed, assessment demo lifted
// to the hero centerpiece (right after the hero), browser-chrome overlay gone,
// and every footer/nav route resolves (no 404). Screenshots at 1440 + 390.
import { test, expect } from '@playwright/test';

test.describe('L-V380 landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
    });
  });

  test('demo is the hero centerpiece, zig-zag wall removed, chrome overlay gone', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // The interactive assessment demo is present and visible.
    const demo = page.locator('#kokeile');
    await expect(demo).toBeVisible();
    await expect(demo.locator('[data-demo-input]')).toBeVisible();

    // The zig-zag feature wall is gone.
    await expect(page.locator('.features__zig')).toHaveCount(0);

    // Demo sits BEFORE the static proof section (it leads the page now).
    const order = await page.evaluate(() => {
      const k = document.querySelector('#kokeile');
      const n = document.querySelector('#nayte');
      if (!k || !n) return null;
      return (k.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'demo-first' : 'proof-first';
    });
    expect(order).toBe('demo-first');

    // B3: the "puheo.fi" browser-chrome overlay no longer renders on the hero.
    await expect(page.locator('.hero__art .shot-chrome')).toHaveCount(0);
  });

  test('no horizontal scroll at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('every footer/nav route resolves (no 404)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Same-origin, navigable links from the live DOM (skip anchors, mailto,
    // external hosts and app routes that require auth state).
    const links = await page.evaluate(() => {
      const origin = location.origin;
      const out = new Set();
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#') || href.startsWith('mailto:')) return;
        let u; try { u = new URL(href, origin); } catch { return; }
        if (u.origin !== origin) return;
        if (u.pathname.startsWith('/app.html')) return; // auth-gated SPA
        out.add(u.pathname);
      });
      return [...out];
    });

    // Must include the per-language routes (B4) so we actually prove they work.
    expect(links).toEqual(expect.arrayContaining([
      '/espanjan-abikurssi', '/ranskan-abikurssi', '/saksan-abikurssi',
    ]));

    const bad = [];
    for (const p of links) {
      const res = await page.request.get(p, { maxRedirects: 5 });
      if (res.status() >= 400) bad.push(`${p} → ${res.status()}`);
    }
    expect(bad, `404s: ${bad.join(', ')}`).toEqual([]);
  });

  test('screenshots 1440 + 390', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/v380-landing-desktop.png', fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/v380-landing-mobile.png', fullPage: true });
  });
});
