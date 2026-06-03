// L-V382 — content moved to dedicated pages: /nayte (full per-language grader
// sample + rubric explainer) and /ukk (FAQ). Landing slimmed: the proof grader
// cards became a teaser linking to /nayte, the FAQ section is gone. All routes
// resolve (no 404), brand unchanged. Screenshots at 1440 + 390.
import { test, expect } from '@playwright/test';

test.describe('L-V382 dedicated pages + landing trim', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
    });
  });

  test('/nayte: deep arviointi page renders with per-language grader sample', async ({ page }) => {
    const res = await page.goto('/nayte');
    expect(res.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.locator('h1#nayte-h1')).toBeVisible();
    // The three language grader cards came over intact.
    await expect(page.locator('.proof__panels .grader-card')).toHaveCount(3);
    await expect(page.locator('#rubric-explain-title')).toBeVisible();
    await expect(page.locator('.rubric-explain__item')).toHaveCount(4);

    // Proof language switch still works (landing-proof-lang.js wired).
    await page.locator('#proof-tab-de').click();
    await expect(page.locator('#proof-panel-de')).toBeVisible();
    await expect(page.locator('#proof-panel-es')).toBeHidden();
  });

  test('/ukk: FAQ page renders all questions with an h1', async ({ page }) => {
    const res = await page.goto('/ukk');
    expect(res.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.locator('h1.faq__title')).toBeVisible();
    await expect(page.locator('.faq-item')).toHaveCount(7);
    // FAQ link in the nav marks itself current on this page.
    await expect(page.locator('.nav__link[href="/ukk"]')).toHaveAttribute('aria-current', 'page');
  });

  test('route aliases resolve (/arviointi, /faq)', async ({ page }) => {
    for (const p of ['/nayte', '/arviointi', '/ukk', '/faq']) {
      const res = await page.request.get(p, { maxRedirects: 5 });
      expect(res.status(), `${p} status`).toBeLessThan(400);
    }
  });

  test('landing trimmed: FAQ section gone, proof is now a teaser to /nayte', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.locator('#faq')).toHaveCount(0);
    await expect(page.locator('.faq-item')).toHaveCount(0);
    // Teaser present and links to the dedicated page.
    await expect(page.locator('.proof--teaser')).toHaveCount(1);
    await expect(page.locator('.proof-teaser__link[href="/nayte"]')).toBeVisible();
    // Nav repointed to the real pages (present in the desktop nav markup;
    // hidden behind the hamburger at mobile widths, so assert existence).
    await expect(page.locator('.nav__link[href="/nayte"]')).toHaveCount(1);
    await expect(page.locator('.nav__link[href="/ukk"]')).toHaveCount(1);
    // Live demo stays the centrepiece.
    await expect(page.locator('#kokeile [data-demo-input]')).toBeVisible();
  });

  test('every same-origin link across landing + new pages resolves (no 404)', async ({ page }) => {
    const pages = ['/', '/nayte', '/ukk'];
    const bad = [];
    for (const start of pages) {
      await page.goto(start);
      await page.waitForLoadState('networkidle').catch(() => {});
      const links = await page.evaluate(() => {
        const origin = location.origin;
        const out = new Set();
        document.querySelectorAll('a[href]').forEach((a) => {
          const href = a.getAttribute('href') || '';
          if (href.startsWith('#') || href.startsWith('mailto:')) return;
          let u; try { u = new URL(href, origin); } catch { return; }
          if (u.origin !== origin) return;
          if (u.pathname.startsWith('/app.html')) return;
          out.add(u.pathname);
        });
        return [...out];
      });
      for (const p of links) {
        const res = await page.request.get(p, { maxRedirects: 5 });
        if (res.status() >= 400) bad.push(`[from ${start}] ${p} → ${res.status()}`);
      }
    }
    expect(bad, `404s: ${bad.join(', ')}`).toEqual([]);
  });

  test('no horizontal scroll at 390px on /nayte and /ukk', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const p of ['/nayte', '/ukk']) {
      await page.goto(p);
      await page.waitForLoadState('networkidle').catch(() => {});
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${p} overflow`).toBeLessThanOrEqual(1);
    }
  });

  test('screenshots 1440 + 390 for both pages', async ({ page }) => {
    const shoot = async (path, name) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(700);
      await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-revealed')));
      await page.screenshot({ path: `screenshots/v382-${name}-desktop.png`, fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(700);
      await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-revealed')));
      await page.screenshot({ path: `screenshots/v382-${name}-mobile.png`, fullPage: true });
    };
    await shoot('/nayte', 'nayte');
    await shoot('/ukk', 'ukk');
    await shoot('/', 'landing');
  });
});
